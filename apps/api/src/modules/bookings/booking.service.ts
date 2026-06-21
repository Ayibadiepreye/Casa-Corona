import {
  db,
  bookingsTable,
  vendorsTable,
  usersTable,
  servicesTable,
  notificationsTable,
} from "@casa-corona/db";
import { eq, and, or, desc, gt, lt, SQL, sql } from "drizzle-orm";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../lib/errors.js";
import { sendBookingConfirmation, sendBookingReceived } from "../../lib/email.js";
import * as emailService from "../../lib/email.js";
import { env } from "../../lib/env.js";

async function createNotification(
  userId: string,
  type: "message" | "review" | "booking" | "payment" | "subscription" | "announcement" | "follow",
  title: string,
  body: string,
  link?: string
) {
  await db.insert(notificationsTable).values({
    userId,
    type,
    title,
    body,
    data: link ? { link } : null,
  });
}

export async function createBooking(userId: string, data: any) {
  // Validate service belongs to vendor
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, data.serviceId), eq(servicesTable.vendorId, data.vendorId)));
  if (!service) throw new BadRequestError("Service does not belong to vendor");

  // Validate scheduledFor is future
  const scheduledForDate = new Date(data.scheduledFor);
  if (scheduledForDate <= new Date()) throw new BadRequestError("scheduledFor must be in the future");

  // Insert booking
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      customerId: userId,
      vendorId: data.vendorId,
      serviceId: data.serviceId,
      scheduledFor: scheduledForDate,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      notes: data.notes,
    })
    .returning();

  // Get vendor's userId to send notification
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, data.vendorId));
  if (!vendor) throw new NotFoundError("Vendor not found");

  // Create notifications
  await createNotification(vendor.userId, "booking", "New Booking Received!", `${data.customerName} booked your service!`, `/bookings/${booking.id}`);

  // Send emails (using branded HTML templates)
  const [vendorProfile] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, data.vendorId));
  const [serviceRow] = await db.select().from(servicesTable).where(eq(servicesTable.id, data.serviceId));
  const [vendorUser] = await db.select().from(usersTable).where(eq(usersTable.id, vendor?.userId));
  const [customerUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  await sendBookingConfirmation(data.customerEmail, {
    customerName: data.customerName,
    vendorName: vendorProfile?.businessName || "Vendor",
    serviceName: serviceRow?.name || "Service",
    scheduledFor: scheduledForDate.toLocaleString("en-NG", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
    notes: data.notes,
  });
  if (vendorUser) {
    await sendBookingReceived(vendorUser.email, {
      customerName: customerUser?.name || data.customerName,
      serviceName: serviceRow?.name || "Service",
      scheduledFor: scheduledForDate.toLocaleString("en-NG", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    });
  }

  return booking;
}

export async function listMyBookings(userId: string, query: any) {
  const { page, limit, status, type } = query;
  const offset = (page - 1) * limit;

  // Check if user is vendor
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId)).limit(1);
  let whereConditions: SQL[] = [];

  if (vendor) {
    whereConditions.push(eq(bookingsTable.vendorId, vendor.id));
  } else {
    whereConditions.push(eq(bookingsTable.customerId, userId));
  }

  if (status) {
    whereConditions.push(eq(bookingsTable.status, status));
  }

  if (type) {
    if (type === "upcoming") {
      whereConditions.push(gt(bookingsTable.scheduledFor, new Date()));
      whereConditions.push(or(eq(bookingsTable.status, "pending"), eq(bookingsTable.status, "confirmed")) as SQL);
    } else if (type === "past") {
      whereConditions.push(
        or(
          lt(bookingsTable.scheduledFor, new Date()),
          eq(bookingsTable.status, "completed")
        ) as SQL
      );
    }
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(whereClause)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(whereClause);

  return { bookings, total: countResult.count, page, pages: Math.ceil(countResult.count / limit) };
}

export async function getBookingById(userId: string, bookingId: string) {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) throw new NotFoundError("Booking not found");

  // Check if user is party
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, booking.vendorId));

  if (user?.role === "admin") return booking;
  if (userId !== booking.customerId && userId !== vendor?.userId) {
    throw new ForbiddenError("Not authorized to view this booking");
  }

  return booking;
}

export async function updateBookingStatus(userId: string, bookingId: string, data: any) {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) throw new NotFoundError("Booking not found");

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, booking.vendorId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const isCustomer = userId === booking.customerId;
  const isVendor = vendor?.userId === userId;
  const isAdmin = user?.role === "admin";

  if (!isCustomer && !isVendor && !isAdmin) throw new ForbiddenError("Not authorized");

  // Permission checks
  if (isCustomer && data.status !== "cancelled") {
    throw new ForbiddenError("Customers can only cancel bookings");
  }
  if (isCustomer && booking.status !== "pending") {
    throw new ForbiddenError("Can only cancel pending bookings");
  }

  // Update
  const updateData: any = { status: data.status, vendorNotes: data.vendorNotes, updatedAt: new Date() };

  // When a booking transitions to completed, compute the commission the platform earns.
  // Default rate: 10% (1000 bps). Stored on the booking for admin reporting.
  if (data.status === "completed") {
    const [current] = await db
      .select({ totalAmount: bookingsTable.totalAmount, rate: bookingsTable.commissionRate })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);
    if (current?.totalAmount && current.totalAmount > 0) {
      const rate = current.rate ?? 1000; // basis points
      updateData.commissionAmount = Math.round((current.totalAmount * rate) / 10000);
    }
  }

  const [updated] = await db
    .update(bookingsTable)
    .set(updateData)
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  // Notify the other party via email
  const [serviceRow] = booking.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId)) : [null];
  const [vendorProfile] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, booking.vendorId));
  const [customerUser] = await db.select().from(usersTable).where(eq(usersTable.id, booking.customerId));
  const [vendorUser] = await db.select().from(usersTable).where(eq(usersTable.id, vendor?.userId || ""));
  const formattedDate = new Date(booking.scheduledFor).toLocaleString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  if (isVendor && customerUser?.email) {
    // Vendor changed status — notify customer
    if (data.status === "confirmed") {
      await sendBookingConfirmation(customerUser.email, {
        customerName: customerUser.name,
        vendorName: vendorProfile?.businessName || "Vendor",
        serviceName: serviceRow?.name || "Service",
        scheduledFor: formattedDate,
        notes: booking.notes,
      });
    } else if (data.status === "cancelled") {
      await emailService.sendEmail(
        customerUser.email,
        "Your booking was declined — Casa Corona",
        emailService.wrapHtml(`
          <p class="greeting">Hi ${customerUser.name},</p>
          <p class="body-text">Unfortunately, <strong>${vendorProfile?.businessName || "the vendor"}</strong> couldn't accept your booking for <strong>${serviceRow?.name || "this service"}</strong> on ${formattedDate}.</p>
          <p class="body-text">You can browse other professionals on Casa Corona — there are many great options.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${env.FRONTEND_URL || "http://localhost:5173"}/browse" class="button">Find another professional →</a>
          </div>
        `, "Booking declined")
      );
    } else if (data.status === "completed") {
      await emailService.sendEmail(
        customerUser.email,
        "How was your experience? — Casa Corona",
        emailService.wrapHtml(`
          <p class="greeting">Hi ${customerUser.name},</p>
          <p class="body-text">Your booking with <strong>${vendorProfile?.businessName || "your vendor"}</strong> is complete. We'd love to hear how it went — your review helps others find great professionals.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${env.FRONTEND_URL || "http://localhost:5173"}/bookings" class="button">Leave a review →</a>
          </div>
        `, "Leave a review")
      );
    }
  } else if (isCustomer && vendorUser?.email) {
    // Customer cancelled — notify vendor
    await emailService.sendEmail(
      vendorUser.email,
      "Booking cancelled by customer — Casa Corona",
      emailService.wrapHtml(`
        <p class="greeting">Booking cancellation</p>
        <p class="body-text"><strong>${customerUser?.name || "A customer"}</strong> cancelled their booking for <strong>${serviceRow?.name || "your service"}</strong> on ${formattedDate}.</p>
        <p class="body-text">The time slot is now available for other bookings.</p>
      `, "Booking cancelled by customer")
    );
  }

  return updated;
}
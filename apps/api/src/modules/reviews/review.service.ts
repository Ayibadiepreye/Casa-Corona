import {
  db,
  reviewsTable,
  vendorsTable,
  usersTable,
  bookingsTable,
  notificationsTable,
} from "@casa-corona/db";
import { eq, and, desc, sql, SQL } from "drizzle-orm";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../lib/errors.js";
import { sendNewReview } from "../../lib/email.js";

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

async function updateVendorStats(vendorId: string) {
  // ── Bayesian average to dampen small samples ─────────────────────────
  // Formula: (C * m + Σratings) / (C + N)
  //   C = confidence weight (how many reviews before raw avg dominates)
  //   m = global mean rating (4.0)
  //   N = actual review count
  // Effect: a vendor with one 5.0 + 0 reviews shows ~4.0 not 5.0
  //         a vendor with 100 reviews all 4.5 shows 4.5
  const C = 5; // confidence weight — needs 5 reviews to "trust" raw average
  const M = 4.0; // prior mean

  const [stats] = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)`,
      reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.vendorId, vendorId));

  if (stats) {
    const n = Number(stats.reviewCount) || 0;
    const rawAvg = Number(stats.avgRating) || 0;
    const bayesian = (C * M + n * rawAvg) / (C + n);
    const clamped = Math.max(1.0, Math.min(5.0, bayesian));

    await db
      .update(vendorsTable)
      .set({
        averageRating: Math.round(clamped * 100) / 100,
        reviewCount: n,
      })
      .where(eq(vendorsTable.id, vendorId));
  }
}

export async function createReview(userId: string, vendorId: string, data: any) {
  // Check if user has completed booking with this vendor
  const [completedBooking] = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.customerId, userId),
        eq(bookingsTable.vendorId, vendorId),
        eq(bookingsTable.status, "completed")
      )
    )
    .limit(1);

  if (!completedBooking) {
    throw new ForbiddenError("You must complete a booking with this vendor to leave a review");
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      vendorId,
      userId,
      bookingId: completedBooking.id,
      rating: data.rating,
      content: data.content,
      photos: data.photos,
    })
    .returning();

  await updateVendorStats(vendorId);

  // Send notification and email
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
  if (vendor) {
    await createNotification(vendor.userId, "review", "New Review Received!", "A customer left you a review!", `/vendors/${vendorId}`);
    const [vendorUser] = await db.select().from(usersTable).where(eq(usersTable.id, vendor.userId));
    const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (vendorUser) {
      await sendNewReview(vendorUser.email, {
        reviewerName: reviewer?.name || "A customer",
        rating: data.rating,
        comment: data.content,
      });
    }
  }

  return review;
}

export async function listVendorReviews(vendorId: string, query: any) {
  const { page, limit, sort } = query;
  const offset = (page - 1) * limit;
  let orderBy: SQL[];

  switch (sort) {
    case "highest":
      orderBy = [desc(reviewsTable.rating), desc(reviewsTable.createdAt)];
      break;
    case "helpful":
      orderBy = [desc(reviewsTable.helpfulCount), desc(reviewsTable.createdAt)];
      break;
    default:
      orderBy = [desc(reviewsTable.createdAt)];
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      content: reviewsTable.content,
      photos: reviewsTable.photos,
      vendorReply: reviewsTable.vendorReply,
      vendorReplyAt: reviewsTable.vendorReplyAt,
      helpfulCount: reviewsTable.helpfulCount,
      createdAt: reviewsTable.createdAt,
      user: { id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl },
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.vendorId, vendorId))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.vendorId, vendorId));

  return { reviews, total: countResult.count, page, pages: Math.ceil(countResult.count / limit) };
}

export async function updateReview(userId: string, reviewId: string, data: any) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) throw new NotFoundError("Review not found");
  if (review.userId !== userId) throw new ForbiddenError("You can only update your own reviews");

  // Check within 7 days of createdAt
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (new Date(review.createdAt) < oneWeekAgo) {
    throw new BadRequestError("You can only edit reviews within 7 days of creating them");
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reviewsTable.id, reviewId))
    .returning();

  await updateVendorStats(review.vendorId);
  return updated;
}

export async function deleteReview(userId: string, reviewId: string) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) throw new NotFoundError("Review not found");

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const isOwner = review.userId === userId;
  const isAdmin = user?.role === "admin";

  if (!isOwner && !isAdmin) throw new ForbiddenError("Not authorized");

  await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
  await updateVendorStats(review.vendorId);
}

export async function replyToReview(userId: string, reviewId: string, content: string) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) throw new NotFoundError("Review not found");

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, review.vendorId));
  if (!vendor || vendor.userId !== userId) {
    throw new ForbiddenError("Only the vendor can reply to this review");
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ vendorReply: content, vendorReplyAt: new Date() })
    .where(eq(reviewsTable.id, reviewId))
    .returning();

  return updated;
}

// Simple helpful toggle, no persistent storage of who helped yet, just count
export async function toggleHelpful(userId: string, reviewId: string) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) throw new NotFoundError("Review not found");

  // Increment helpful count
  const [updated] = await db
    .update(reviewsTable)
    .set({ helpfulCount: review.helpfulCount + 1 })
    .where(eq(reviewsTable.id, reviewId))
    .returning();

  return updated;
}

export async function reportReview(userId: string, reviewId: string, reason: string) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) throw new NotFoundError("Review not found");

  await db.update(reviewsTable).set({ reported: true }).where(eq(reviewsTable.id, reviewId));

  // Create admin notification? Skipping for now
}

export async function listMyReviews(userId: string) {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, userId))
    .orderBy(desc(reviewsTable.createdAt));

  return reviews;
}
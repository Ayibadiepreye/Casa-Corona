
import { db, usersTable, vendorsTable, bookingsTable, messagesTable, conversationsTable, platformSettingsTable } from "@casa-corona/db";
import { eq, count, sql } from "drizzle-orm";

const [adminCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "admin"));
const [vendorCount] = await db.select({ count: count() }).from(vendorsTable);
const [bookingCount] = await db.select({ count: count() }).from(bookingsTable);
const [messageCount] = await db.select({ count: count() }).from(messagesTable);
const [convCount] = await db.select({ count: count() }).from(conversationsTable);
const [pricingSetting] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "pricing"));

console.log(JSON.stringify({
  admins: adminCount.count,
  vendors: vendorCount.count,
  bookings: bookingCount.count,
  messages: messageCount.count,
  convs: convCount.count,
  reg_fee: (pricingSetting?.value as any)?.registration_fee,
}, null, 2));

process.exit(0);

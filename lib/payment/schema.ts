import { pgTable, text, uuid, timestamp, bigint } from "drizzle-orm/pg-core";
import { users } from "../user/schema";

export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amount: bigint("amount", { mode: "number" }).notNull(), 
    currency: text("currency").notNull().default("eur"),
    status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
    description: text("description"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at").defaultNow(),
    paidAt: timestamp("paid_at"),
});


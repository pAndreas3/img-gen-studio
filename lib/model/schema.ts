import { pgTable, text, uuid, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { datasets } from "../dataset/schema";
import { users } from "../user/schema";

export const models = pgTable("models", {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url"),                          // Model weights URL (from training)
    endpoint_url: text("endpoint_url"),        // RunPod inference endpoint URL
    training_run_id: text("training_run_id"),  // RunPod training job ID (used for status tracking)
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(),              // e.g. "small", "high-quality", "fast"
    resolution: text("resolution"),            // e.g. "512x512", "1024x1024"
    training_steps: integer("training_steps"), // e.g. 1000
    estimated_time_minutes: integer("estimated_time_minutes"),
    status: text("status").default("pending"), // e.g. "pending", "training", "completed"
    thumbnail: text("thumbnail"),
    created_at: timestamp("created_at").defaultNow(),
    completed_at: timestamp("completed_at"),
    dataset_id: uuid("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "no action" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  });
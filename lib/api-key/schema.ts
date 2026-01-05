import {
    timestamp,
    pgTable,
    text,
    uuid,
    boolean
} from "drizzle-orm/pg-core"
import { users } from "../user/schema"

export const apiKeys = pgTable("api_key", {
    id: uuid("id")
        .primaryKey()
        .defaultRandom(),
    
    // Reference to the user who owns this API key
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    
    // The actual API key (hashed for security)
    keyHash: text("key_hash").notNull().unique(),
    
    // Optional name/description for the key (e.g., "Production App", "Development")
    name: text("name"),
    
    // Last 4 characters of the original key for display purposes
    keyPreview: text("key_preview").notNull(),
    
    // Whether the key is currently active
    isActive: boolean("is_active").default(true).notNull(),
    
    // When the key was created
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),

    // Optional expiration date
    expiresAt: timestamp("expires_at", { mode: "date" }),
    
})

// Type inference for TypeScript
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert

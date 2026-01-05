import { pgTable, text, uuid, serial, integer } from "drizzle-orm/pg-core";
import { users } from "../user/schema";

export const datasets = pgTable("datasets", {
    id: uuid("id")
    .primaryKey()
    .defaultRandom(),
    url: text("url").notNull(),
    number_of_images: integer("number_of_images").notNull(),
    user_id: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});
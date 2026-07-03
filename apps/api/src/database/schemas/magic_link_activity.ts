import { pgTable, pgEnum, varchar, timestamp } from "drizzle-orm/pg-core";
import crypto from "crypto";
import { magic_links } from "./magic_links";

export const activityResultEnum = pgEnum("activity_result", [
    "success",
    "failed_expired",
    "failed_used",
    "failed_revoked",
]);

export const magic_link_activity = pgTable("magic_link_activity", {
    id: varchar("id", { length: 36 })
        .$defaultFn(() => crypto.randomUUID())
        .primaryKey(),

    magic_link_id: varchar("magic_link_id", { length: 36 })
        .references(() => magic_links.id)
        .notNull(),

    timestamp: timestamp("timestamp")
        .defaultNow()
        .notNull(),

    result: activityResultEnum("result").notNull(),

    ip: varchar("ip", { length: 45 }).notNull(),

    device: varchar("device", { length: 200 }).notNull(),
});

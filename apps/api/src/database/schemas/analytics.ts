import {
    pgTable,
    integer,
    varchar,
    timestamp,
    text
} from "drizzle-orm/pg-core";

export const page_views = pgTable("page_views",{
    id_page_views: integer("id_page_views").primaryKey().generatedAlwaysAsIdentity(),

    page_path: varchar("page_path", {length:500}).notNull(),

    referrer: varchar("referrer", {length:500}),

    user_agent: text("user_agent"),

    ip_address: varchar("ip_address", {length:45}),

    session_id: varchar("session_id", {length:64}),

    device_type: varchar("device_type", {length:20}),

    country: varchar("country", {length:100}),

    city: varchar("city", {length:100}),

    created_at: timestamp("created_at").defaultNow(),
});

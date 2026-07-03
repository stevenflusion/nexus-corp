import {
    pgTable,
    integer,
    varchar,
    timestamp,
    boolean
} from "drizzle-orm/pg-core";

export const admin_users = pgTable("admin_users",{

    id_admin_users: integer("id_admin_users").primaryKey().generatedAlwaysAsIdentity(),

    name_admin_users: varchar("name_admin_users",{length:100}).notNull(),

    email_admin_users: varchar("email_admin_users",{length:150})
        .unique()
        .notNull(),

    password_admin_users: varchar("password_admin_users",{length:150}).notNull(),

    active: boolean("active")
        .default(true),

    createdAt: timestamp("created_at")
        .defaultNow()

});
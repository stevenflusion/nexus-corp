import {
    pgTable,
    integer,
    varchar,
    timestamp
} from "drizzle-orm/pg-core";

import { admin_users } from "./admin_users";

export const audit_logs = pgTable("audit_logs",{

    id_audit_logs: integer("id_audit_logs").primaryKey().generatedAlwaysAsIdentity(),

    action_audit_logs: varchar("action_audit_logs", {length:100}).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow(),


    id_admin_users: integer("id_admin_users")
        .references(()=>admin_users.id_admin_users)
        .notNull(),
});
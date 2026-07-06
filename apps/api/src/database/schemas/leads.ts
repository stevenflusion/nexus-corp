import {pgTable, integer, pgEnum, timestamp, varchar, decimal, text, boolean} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status_leads", ["new", "contacted", "qualified", "lost"]);
export const sourceEnum = pgEnum("source_leads", ["web", "manual", "quote", "chatbot", "otro"]);

export const leads = pgTable("leads", {
    id_leads: integer("id_leads").primaryKey().generatedAlwaysAsIdentity(),
    name_leads: varchar("name_leads", {length:100}).notNull(),
    email_leads: varchar("email_leads", {length:100}).notNull(),
    phone_leads: varchar("phone_leads", {length:100}).notNull().unique(),
    city_leads: varchar("city_leads", {length:100}).notNull(),
    status_leads: statusEnum("status_leads").default("new"),
    source_leads: sourceEnum("source_leads").default("web"),
    monthly_family_income: decimal("monthly_family_income", { precision: 10, scale: 2 }),
    coments_optionals_lead: text("coments_optionals_lead"),
    accepted_terms_lead: boolean("accepted_terms_lead").default(false),
    accepted_terms_at: timestamp("accepted_terms_at"),
    accepted_terms_ip: varchar("accepted_terms_ip", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
import { pgTable, integer, timestamp, varchar, pgEnum, decimal } from "drizzle-orm/pg-core";
import { leads } from "./leads";

export const productEnum = pgEnum("product_quotes", ["vehicle", "housing", "consumer"]);
export const contactPreferenceEnum = pgEnum("contact_preference_quotes", ["phone", "email", "whatsapp", "other"]);

export const quotes = pgTable("quotes", {
    id_quotes: integer("id_quotes").primaryKey().generatedAlwaysAsIdentity(),
    lead_id: integer("lead_id")
        .references(() => leads.id_leads, {
            onDelete: "cascade",
        })
        .notNull(),
    product_quotes: productEnum("product_quotes").notNull(),
    requested_amount_quotes: decimal("requested_amount_quotes", { precision: 10, scale: 2 }).notNull(),
    down_payment_quotes: decimal("down_payment_quotes", { precision: 10, scale: 2 }).notNull(),
    term_months_quotes: integer("term_months_quotes").notNull(),
    annual_interest_rate_quotes: decimal("annual_interest_rate_quotes", { precision: 5, scale: 2 }).notNull(),
    monthly_payment_quotes: decimal("monthly_payment_quotes", { precision: 10, scale: 2 }).notNull(),
    contact_preference_quotes: contactPreferenceEnum("contact_preference_quotes").notNull(),
    result_status_quotes : varchar("result_status_quotes", { length: 50 }).default("pending"),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
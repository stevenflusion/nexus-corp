import {pgTable, integer, text, timestamp, varchar} from "drizzle-orm/pg-core";

import { leads } from "./leads";

export const lead_notes = pgTable("lead_notes", {
    id_lead_notes: integer("id_lead_notes").primaryKey().generatedAlwaysAsIdentity(),
    manager_lead_notes: varchar("manager_lead_notes", {length:100}).notNull(),
    note_lead_notes: text("note_lead_notes").notNull(),
    id_leads: integer("id_leads").references(()=> leads.id_leads).notNull(),
    createdAt: timestamp("created_at").defaultNow()
});
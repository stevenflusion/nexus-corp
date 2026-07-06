import {
    pgTable,
    integer,
    varchar,
    timestamp,
    pgEnum
} from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { magic_links } from "./magic_links";

export const statusEnum = pgEnum("status_credit_scores", ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]);

export const credit_scores = pgTable("credit_scores",{
    id_credit_scores: integer("id_credit_scores").primaryKey().generatedAlwaysAsIdentity(),
    storage_path_contract : varchar("storage_path_contract", {length:255})
    .notNull(),
    storage_path_selfie : varchar("storage_path_selfie", {length:255})
    .notNull(),
    result_credit_scores : integer("result_credit_scores"),
    id_leads : integer("id_leads").references(()=> leads.id_leads)
    .notNull(),
    status_credit_scores : statusEnum("status_credit_scores").default("PENDING"),
    observations_credit_scores : varchar("observations_credit_scores", {length:500}),
    reviewed_by_magic_link: varchar("reviewed_by_magic_link", {
    length: 36,
    }).references(() => magic_links.id),
    create_at : timestamp("create_at").defaultNow().notNull(),
    update_at : timestamp("update_at").defaultNow().notNull(),
});
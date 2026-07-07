import { pgTable, pgEnum, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import crypto from "crypto";

export const magicLinkStatusEnum = pgEnum("magic_link_status", [
    "active",
    "expired",
    "used",
    "revoked",
]);

export const magicLinkRoleEnum = pgEnum("magic_link_role", [
    "admin",
    "sistemas",
    "gerente_general",
    "gerencia_marketing",
]);

export const deliveryChannelEnum = pgEnum("delivery_channel", [
    "generate_only",
    "send_email",
    "generate_qr",
]);

export const expirationTypeEnum = pgEnum("expiration_type", [
    "relative",
    "absolute",
]);

export const usageLimitTypeEnum = pgEnum("usage_limit_type", [
    "single",
    "unlimited",
    "specific",
]);

export const magic_links = pgTable("magic_links", {
    id: varchar("id", { length: 36 })
        .$defaultFn(() => crypto.randomUUID())
        .primaryKey(),

    token_hash: varchar("token_hash", { length: 64 }).notNull(),

    status: magicLinkStatusEnum("status")
        .default("active")
        .notNull(),

    recipientName: varchar("recipient_name", { length: 100 }).notNull(),

    recipientEmail: varchar("recipient_email", { length: 150 }),

    recipientPhone: varchar("recipient_phone", { length: 50 }),

    internalNote: text("internal_note"),

    role: magicLinkRoleEnum("role").notNull(),

    scope: varchar("scope", { length: 100 }).notNull(),

    scopeId: varchar("scope_id", { length: 100 }).notNull(),

    destinationScreen: varchar("destination_screen", { length: 100 }).notNull(),

    expirationType: expirationTypeEnum("expiration_type")
        .default("relative")
        .notNull(),

    expirationDate: timestamp("expiration_date"),

    deferredActivation: timestamp("deferred_activation"),

    usageLimitType: usageLimitTypeEnum("usage_limit_type")
        .default("unlimited")
        .notNull(),

    usageLimit: integer("usage_limit"),

    usageCount: integer("usage_count")
        .default(0)
        .notNull(),

    deliveryChannel: deliveryChannelEnum("delivery_channel")
        .default("generate_only")
        .notNull(),

    createdBy: varchar("created_by", { length: 100 }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});

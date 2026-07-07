import { z } from "zod";

// ==========================
// CREATE MAGIC LINK
// ==========================

// Selectable admin-panel-web routes a magic link can redirect to after verify.
// MUST mirror the SELECTABLE destinations in
// apps/admin-panel-web/src/lib/nav.ts (entries where selectable === true).
// Universal routes (Tema, 404) are NOT here — they're always accessible once
// logged in, not valid as a landing page.
export const VALID_DESTINATION_SCREENS = [
    "/dashboard/all",
    "/dashboard",
    "/dashboard/magic-links",
    "/dashboard/leads",
    "/dashboard/analytics",
] as const

export const createMagicLinkSchema = z.object({
    recipientName: z.string().min(1).max(100),
    recipientEmail: z.string().email().max(150).nullable().default(null),
    recipientPhone: z.string().max(50).nullable().default(null),
    internalNote: z.string().max(2000).nullable().default(null),
    role: z.enum(["admin", "sistemas", "gerente_general", "gerencia_marketing"]),
    scope: z.string().min(1).max(100),
    scopeId: z.string().min(1).max(100),
    destinationScreen: z.enum(VALID_DESTINATION_SCREENS),
    expirationType: z.enum(["relative", "absolute"]),
    expirationDate: z.string().datetime().nullable().default(null),
    deferredActivation: z.string().datetime().nullable().default(null),
    usageLimitType: z.enum(["single", "unlimited", "specific"]),
    usageLimit: z.number().int().min(1).nullable().default(null),
    deliveryChannel: z.enum(["generate_only", "send_email", "generate_qr"]),
    createdBy: z.string().max(100).optional().default("Admin Nexus"),
});

export type CreateMagicLinkInput = z.infer<typeof createMagicLinkSchema>;

// ==========================
// EXTEND MAGIC LINK
// ==========================

export const extendMagicLinkSchema = z.object({
    expirationDate: z.string().datetime(),
});

export type ExtendMagicLinkInput = z.infer<typeof extendMagicLinkSchema>;

// ==========================
// VERIFY MAGIC LINK
// ==========================

export const verifyMagicLinkSchema = z.object({
    token: z.string().min(1),
});

export type VerifyMagicLinkInput = z.infer<typeof verifyMagicLinkSchema>;

// ==========================
// LIST FILTERS
// ==========================

export const magicLinkFiltersSchema = z.object({
    search: z.string().max(150).optional(),
    status: z.enum(["active", "expired", "used", "revoked"]).optional(),
    role: z.enum(["admin", "sistemas", "gerente_general", "gerencia_marketing"]).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type MagicLinkFiltersInput = z.infer<typeof magicLinkFiltersSchema>;

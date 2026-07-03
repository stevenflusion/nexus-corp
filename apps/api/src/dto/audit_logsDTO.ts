import type { InferModel } from "drizzle-orm";
import { audit_logs } from "../database/schemas/audit_logs";

export type AuditLogDTO = InferModel<typeof audit_logs>;

export type AuditLogCreateDto = Pick<AuditLogDTO, "action_audit_logs" | "id_admin_users">;

export type AuditLogResponseCreateDto = Pick<AuditLogDTO, "action_audit_logs" | "id_admin_users">; 

export type AuditLogResponseDto = Pick<AuditLogDTO, "action_audit_logs" | "created_at" | "id_admin_users">;

export function sanitizeAuditLogCreate(body: unknown): AuditLogCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const action_audit_logs = typeof payload.action_audit_logs === "string" ? payload.action_audit_logs.trim() : "";
  const id_admin_users = typeof payload.id_admin_users === "number" ? payload.id_admin_users : undefined;

  if (!action_audit_logs || id_admin_users === undefined || Number.isNaN(id_admin_users)) {
    return null;
  }

  return {
    action_audit_logs,
    id_admin_users,
  };
}

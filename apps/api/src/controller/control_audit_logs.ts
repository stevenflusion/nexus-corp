import { Hono } from "hono";
import { audit_logs } from "../database/schemas/audit_logs";
import { createOne, getAll } from "../utils/crud";
import { AuditLogCreateDto, AuditLogResponseDto, sanitizeAuditLogCreate, AuditLogResponseCreateDto } from "../dto/audit_logsDTO";

const auditLogsController = new Hono();

auditLogsController.get("/", async (c) => {
  const logs = await getAll<AuditLogResponseDto>(audit_logs);
  return c.json(logs);
});

auditLogsController.post("/", async (c) => {
  const body = await c.req.json();
  const payload = sanitizeAuditLogCreate(body);

  if (!payload) {
    return c.json({ error: "action_audit_logs and id_admin_users are required" }, 400);
  }

  const created = await createOne<AuditLogCreateDto>(audit_logs, payload);

  const response: AuditLogResponseCreateDto = {
    action_audit_logs: created.action_audit_logs,
    id_admin_users: created.id_admin_users,
  };

  return c.json(response, 201);
});

export { auditLogsController };

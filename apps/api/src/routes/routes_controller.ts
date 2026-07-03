import { Hono } from "hono";
import { leadsController } from "../controller/control_lead";
import { quotesController } from "../controller/control_quote";
import { leadNotesController } from "../controller/control_lead_notes";
import { admin_usersController } from "../controller/control_adm";
import { auditLogsController } from "../controller/control_audit_logs";
import { authController } from "../controller/control_auth";

const apiRouter = new Hono();

// Agrupamos todos tus controladores bajo sus respectivos prefijos
apiRouter.route("/leads", leadsController);
apiRouter.route("/quotes", quotesController);
apiRouter.route("/notes", leadNotesController);
apiRouter.route("/admin", admin_usersController);
apiRouter.route("/audit-logs", auditLogsController);
apiRouter.route("/auth", authController);



export { apiRouter };
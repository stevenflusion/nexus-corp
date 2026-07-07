import { Hono } from "hono";
import { leadsController } from "../controller/control_lead";
import { quotesController } from "../controller/control_quote";
import { leadNotesController } from "../controller/control_lead_notes";
import { admin_usersController } from "../controller/control_adm";
import { auditLogsController } from "../controller/control_audit_logs";
import { authController } from "../controller/control_auth";
import { magicLinksController } from "../controller/control_magic_links";
import { magicLinkAuthController } from "../controller/control_magic_link_auth";
import { creditScoresController } from "../controller/control_credit_scores";
import { analyticsController } from "../controller/control_analytics";

const apiRouter = new Hono();

// Agrupamos todos tus controladores bajo sus respectivos prefijos

apiRouter.route("/leads", leadsController);


apiRouter.route("/quotes", quotesController);

apiRouter.route("/credit-scores", creditScoresController);

apiRouter.route("/notes", leadNotesController);

apiRouter.route("/admin", admin_usersController);

apiRouter.route("/audit-logs", auditLogsController);

apiRouter.route("/analytics", analyticsController);

//Sin authMiddleware porque ya esta integrado en su controller
apiRouter.route("/auth", authController);
apiRouter.route("/magic-links", magicLinksController);
apiRouter.route("/auth/magic-link", magicLinkAuthController);



export { apiRouter };
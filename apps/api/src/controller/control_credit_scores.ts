import { Hono } from "hono";
import { creditScoreService } from "../services/credit_scores_services";
import { santizaCreateCreditScoreWhitLead } from "../dto/credit_scores.dto";

const creditScoresController = new Hono();


// ============================
// 1. CREAR CREDIT SCORE
// POST /credit-scores
// ============================
creditScoresController.post("/", async (c) => {

    const form = await c.req.parseBody();

    const id_leads = Number(form.id_leads);

    const contract = form.contract;
    const selfie = form.selfie;

    if (isNaN(id_leads)) {
        return c.json({ error: "id_leads required" }, 400);
    }

    if (!(contract instanceof File) || !(selfie instanceof File)) {
        return c.json(
            { error: "Contract and selfie are required files" },
            400
        );
    }

    try {
        const result = await creditScoreService.createRequest(
            { id_leads },
            contract,
            selfie
        );

        return c.json(result, 201);

    } catch (error) {
        console.error(error);
        return c.json({ error: "Internal server error" }, 500);
    }
});


// ============================
// 2. LISTAR TODOS (ADMIN)
// GET /credit-scores
// ============================
creditScoresController.get("/", async (c) => {

    try {
        const data = await creditScoreService.findAll();
        return c.json(data, 200);

    } catch (error) {
        console.error("Error listing credit scores:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});


// ============================
// 3. OBTENER UNO POR ID
// GET /credit-scores/:id
// ============================
creditScoresController.get("/:id", async (c) => {

    const idParam = c.req.param("id");
    const id = Number(idParam);

    if (!idParam || isNaN(id)) {
        return c.json({ error: "Invalid id" }, 400);
    }

    try {
        const data = await creditScoreService.findOne(id);

        if (!data) {
            return c.json({ error: "Not found" }, 404);
        }

        return c.json(data, 200);

    } catch (error) {
        console.error("Error getting credit score:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});


// ============================
// 4. ACTUALIZAR (ADMIN / ASESOR)
// PUT /credit-scores/:id
// ============================
creditScoresController.put("/:id", async (c) => {

    const idParam = c.req.param("id");
    const id = Number(idParam);

    if (!idParam || isNaN(id)) {
        return c.json({ error: "Invalid id" }, 400);
    }

    const body = await c.req.json();

    try {
        const result = await creditScoreService.update(id, body);

        if (!result) {
            return c.json({ error: "Not found" }, 404);
        }

        return c.json(result, 200);

    } catch (error) {
        console.error("Error updating credit score:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

// ============================
// 4. OBTENER URL DE CONTRATO
// GET /credit-scores/contract/:id
// ============================


creditScoresController.get("/contract/:id", async (c) =>{
    const idParam = c.req.param("id");
    const id = Number(idParam);

    if (!idParam || isNaN(id)) {
        return c.json({ error: "Invalid id" }, 400);
    }

    try {
        const result = await creditScoreService.getContractUrl(id);

        if (!result) {
            return c.json({ error: "Not found" }, 404);
        }

        return c.json(result, 200);

    } catch (error) {
        console.error("Error getting credit score contract URL:", error);
        return c.json({ error: "Internal server error" }, 500);
    }

});

// ============================
// 5. OBTENER URL DE SELFIE
// GET /credit-scores/selfie/:id
// ============================

creditScoresController.get("/selfie/:id", async (c) =>{
    const idParam = c.req.param("id");
    const id = Number(idParam);

    if (!idParam || isNaN(id)) {
        return c.json({ error: "Invalid id" }, 400);
    }

    try {
        const result = await creditScoreService.getSelfieUrl(id);

        if (!result) {
            return c.json({ error: "Not found" }, 404);
        }

        return c.json(result, 200);

    } catch (error) {
        console.error("Error getting credit score selfie URL:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

export { creditScoresController };
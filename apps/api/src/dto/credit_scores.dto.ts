import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { credit_scores } from "../database/schemas/credit_scores";

/**
 * Base DTOs obtenidos desde Drizzle
 */
export type CreditScoreDTO = InferSelectModel<typeof credit_scores>;
export type CreditScoreCreateDTO = InferInsertModel<typeof credit_scores>;

/**
 * Cliente -> Solicitar consulta de score
 */
export interface RequestCreditScoreWithLeadDto {
    name_leads: string;
    email_leads: string;
    phone_leads: string;
    city_leads: string;
}

/**
 * Admin -> Listado de solicitudes
 */
export interface AllCreditScoresWithLeadDto {
    id_credit_scores: number;

    name_leads: string;
    phone_leads: string;
    email_leads: string;

    storage_path_contract: string;
    storage_path_selfie: string;

    status_credit_scores: CreditScoreDTO["status_credit_scores"];

    observations_credit_scores: string | null;

    result_credit_scores: number | null;

    create_at: Date;
}

/**
 * Admin -> Detalle de una solicitud
 */
export interface CreditScoreWithLeadDto {
    id_credit_scores: number;

    name_leads: string;
    email_leads: string;
    phone_leads: string;
    city_leads: string;

    storage_path_contract: string;
    storage_path_selfie: string;

    status_credit_scores: CreditScoreDTO["status_credit_scores"];

    observations_credit_scores: string | null;

    result_credit_scores: number | null;

    create_at: Date;

    update_at: Date;
}

/**
 * Admin -> Actualizar solicitud
 */
export interface UpdateCreditScoresDto {
    status_credit_scores: CreditScoreDTO["status_credit_scores"];

    result_credit_scores?: number;

    observations_credit_scores?: string;

    reviewed_by_magic_link: string;

    update_at: Date;
}

export interface RequestCreditScoreDto{
    id_leads: number;
}

/**
 * Cliente -> Sanitizar solicitud
 */
export function sanitizeRequestCreditScoreWithLead(
    body: unknown
): RequestCreditScoreWithLeadDto | null {
    if (!body || typeof body !== "object") return null;

    const payload = body as Record<string, unknown>;


    const name_leads =
        typeof payload.name_leads === "string"
            ? payload.name_leads.trim()
            : "";

    const email_leads =
        typeof payload.email_leads === "string"
            ? payload.email_leads.trim()
            : "";

    const phone_leads =
        typeof payload.phone_leads === "string"
            ? payload.phone_leads.trim()
            : "";

    const city_leads =
        typeof payload.city_leads === "string"
            ? payload.city_leads.trim()
            : "";

    if (!name_leads || !email_leads || !phone_leads || !city_leads) {
        return null;
    }

    return {
        name_leads,
        email_leads,
        phone_leads,
        city_leads,
    };
}

/**
 * Admin -> Sanitizar actualización
 */
export function sanitizeUpdateCreditScores(
    body: unknown
): UpdateCreditScoresDto {
    const payload =
        body && typeof body === "object"
            ? (body as Record<string, unknown>)
            : {};

    const updated: UpdateCreditScoresDto = {
        reviewed_by_magic_link: "",
        status_credit_scores: "PENDING",
        update_at: new Date(),
    };

    if (typeof payload.status_credit_scores === "string") {
        updated.status_credit_scores =
            payload.status_credit_scores as CreditScoreDTO["status_credit_scores"];
    }

    if (typeof payload.result_credit_scores === "number") {
        updated.result_credit_scores = payload.result_credit_scores;
    }

    if (typeof payload.observations_credit_scores === "string") {
        updated.observations_credit_scores =
            payload.observations_credit_scores.trim();
    }

    if (typeof payload.reviewed_by_magic_link === "string") {
        updated.reviewed_by_magic_link =
            payload.reviewed_by_magic_link.trim();
    }

    return updated;
}

export function santizaCreateCreditScoreWhitLead(
    body: unknown
) : RequestCreditScoreDto | null {
     if (!body || typeof body !== "object") return null;

    const payload = body as Record<string, unknown>;

    const id_leads_raw = payload.id_leads;


    const id_leads =
    typeof payload.id_leads === "string"
        ? Number(payload.id_leads)
        : undefined;

    if (!id_leads || isNaN(id_leads)) {
        return null;
    }

    return{
        id_leads
    };

}
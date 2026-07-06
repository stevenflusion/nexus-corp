import { eq } from "drizzle-orm";
import { db } from "../database/database";

import { credit_scores } from "../database/schemas/credit_scores";
import { leads } from "../database/schemas/leads";

import {
    createOne,
    getById,
    updateById,
} from "../utils/crud";

import type {
    CreditScoreDTO,
    AllCreditScoresWithLeadDto,
    CreditScoreWithLeadDto,
    UpdateCreditScoresDto
} from "../dto/credit_scores.dto";

export class CreditScoreRepository {

    async create(data: Omit<CreditScoreDTO, "id_credit_scores">) {
        return createOne(credit_scores, data);
    }

    async getById(id: number) {
        return getById<CreditScoreDTO>(
            credit_scores,
            credit_scores.id_credit_scores,
            id
        );
    }

    async update(
        id: number,
        data: UpdateCreditScoresDto
    ) {
        return updateById(
            credit_scores,
            credit_scores.id_credit_scores,
            id,
            {
            status_credit_scores: data.status_credit_scores,
            result_credit_scores: data.result_credit_scores,
            observations_credit_scores: data.observations_credit_scores,
            reviewed_by_magic_link: data.reviewed_by_magic_link,
            update_at: new Date(),
            }
        );
    }

    async getAllWithLead(): Promise<AllCreditScoresWithLeadDto[]> {

        return db
            .select({
                id_credit_scores: credit_scores.id_credit_scores,

                name_leads: leads.name_leads,
                phone_leads: leads.phone_leads,
                email_leads: leads.email_leads,

                storage_path_contract: credit_scores.storage_path_contract,
                storage_path_selfie: credit_scores.storage_path_selfie,

                status_credit_scores: credit_scores.status_credit_scores,

                observations_credit_scores:
                    credit_scores.observations_credit_scores,

                result_credit_scores:
                    credit_scores.result_credit_scores,

                create_at: credit_scores.create_at,
            })
            .from(credit_scores)
            .innerJoin(
                leads,
                eq(
                    credit_scores.id_leads,
                    leads.id_leads
                )
            );

    }

    async getOneWithLead(
        id: number
    ): Promise<CreditScoreWithLeadDto | undefined> {

        const [row] = await db
            .select({
                id_credit_scores: credit_scores.id_credit_scores,

                name_leads: leads.name_leads,
                email_leads: leads.email_leads,
                phone_leads: leads.phone_leads,
                city_leads: leads.city_leads,

                storage_path_contract:
                    credit_scores.storage_path_contract,

                storage_path_selfie:
                    credit_scores.storage_path_selfie,

                status_credit_scores:
                    credit_scores.status_credit_scores,

                observations_credit_scores:
                    credit_scores.observations_credit_scores,

                result_credit_scores:
                    credit_scores.result_credit_scores,

                create_at: credit_scores.create_at,

                update_at: credit_scores.update_at,
            })
            .from(credit_scores)
            .innerJoin(
                leads,
                eq(
                    credit_scores.id_leads,
                    leads.id_leads
                )
            )
            .where(
                eq(
                    credit_scores.id_credit_scores,
                    id
                )
            )
            .limit(1);

        return row;
    }
}

export const creditScoreRepository =
    new CreditScoreRepository();
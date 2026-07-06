import { creditScoreRepository } from "../repositories/credit_scores_repositories";
import { azureStorageService } from "./azure/azure_services";

import type { RequestCreditScoreDto, UpdateCreditScoresDto } from "../dto/credit_scores.dto";

export class CreditScoreService {

    async createRequest(
        data: RequestCreditScoreDto,
        contractFile: File,
        selfieFile: File
    ) {

        // 1. Subir contrato a Azure
        const contractPath = await azureStorageService.upload(
            contractFile,
            "contracts"
        );

        // 2. Subir selfie a Azure
        const selfiePath = await azureStorageService.upload(
            selfieFile,
            "selfies"
        );

        if (!data.id_leads) {
            throw new Error("id_leads is required");
            }   

        // 3. Crear credit score usando SOLO id_leads
        const creditScore = await creditScoreRepository.create({
            id_leads: data.id_leads,

            storage_path_contract: contractPath,
            storage_path_selfie: selfiePath,

            status_credit_scores: "PENDING",
            result_credit_scores: null,
            observations_credit_scores: null,
            reviewed_by_magic_link: null,

            create_at: new Date(),
            update_at: new Date(),
        });

        return creditScore;
    }

    async findAll(){
        return await creditScoreRepository.getAllWithLead();
    }

    async findOne(id: number){
        return await creditScoreRepository.getById(id);
    }

    async getContractUrl(id: number){
        const creditScore = await creditScoreRepository.getById(id);
        if (!creditScore) {
            throw new Error("Credit score not found");
        }
        return azureStorageService.generateDownloadUrl(creditScore.storage_path_contract);
    }

    async getSelfieUrl(id: number){
        const creditScore = await creditScoreRepository.getById(id);
        if(!creditScore){
            throw new Error("Selfie score not fount");
        }
        return azureStorageService.generateDownloadUrl(creditScore.storage_path_selfie);
    }

        async update(
        id: number,
        data: UpdateCreditScoresDto
    ) {

        return await creditScoreRepository.update(id, {
            status_credit_scores: data.status_credit_scores,
            result_credit_scores: data.result_credit_scores,
            observations_credit_scores: data.observations_credit_scores,
            reviewed_by_magic_link: data.reviewed_by_magic_link,
            update_at: new Date(),
        });
    }

}

export const creditScoreService = new CreditScoreService();
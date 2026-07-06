import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export class AzureStorageService {

    async upload(file: File, folder: string): Promise<string> {
        const containerClient = blobServiceClient.getContainerClient("documents");

        const fileName = `${folder}/${randomUUID()}-${file.name}`;

        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        const buffer = Buffer.from(await file.arrayBuffer());

        await blockBlobClient.uploadData(buffer);

        return fileName; // esto es lo que guardas en DB
    }

    async generateDownloadUrl(storagePath: string): Promise<string> {
    throw new Error("Not implemented");
}
}

export const azureStorageService = new AzureStorageService();
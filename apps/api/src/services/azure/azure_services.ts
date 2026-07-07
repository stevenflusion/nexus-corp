import {
    BlobSASPermissions,
    BlobServiceClient,
    generateBlobSASQueryParameters,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { randomUUID } from "crypto";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const CONTAINER_NAME = "documents";
const SAS_EXPIRY_MINUTES = 15; // tiempo de validez de la URL temporal

export class AzureStorageService {

    async upload(file: File, folder: string): Promise<string> {
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Idempotente: si el container ya existe (Azure real) no hace nada.
        // Si no existe (ej. Azurite recién levantado) lo crea automáticamente.
        await containerClient.createIfNotExists();

        const fileName = `${folder}/${randomUUID()}-${file.name}`;

        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        const buffer = Buffer.from(await file.arrayBuffer());

        await blockBlobClient.uploadData(buffer);

        return fileName; // esto es lo que guardas en DB
    }

    async generateDownloadUrl(storagePath: string): Promise<string> {
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        const blockBlobClient = containerClient.getBlockBlobClient(storagePath);

        const credential = blobServiceClient.credential;

        if (!(credential instanceof StorageSharedKeyCredential)) {
            throw new Error(
                "No se pudo generar la SAS URL: la credencial actual no soporta firma (StorageSharedKeyCredential)."
            );
        }

        const expiresOn = new Date(Date.now() + SAS_EXPIRY_MINUTES * 60 * 1000);

        const sasToken = generateBlobSASQueryParameters(
            {
                containerName: CONTAINER_NAME,
                blobName: storagePath,
                permissions: BlobSASPermissions.parse("r"), // solo lectura
                expiresOn,
            },
            credential
        ).toString();

        return `${blockBlobClient.url}?${sasToken}`;
    }
}

export const azureStorageService = new AzureStorageService();
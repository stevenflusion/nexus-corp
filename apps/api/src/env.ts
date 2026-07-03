// Loads environment variables from the monorepo root .env file.
// Must be the first import in any entry point that reads process.env.
import { config } from "dotenv";

config({ path: "../../.env" });

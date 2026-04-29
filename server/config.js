import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const HOST = process.env.HOST || "0.0.0.0";
export const PORT = Number(process.env.PORT || 6670);
export const DIST_DIR = path.resolve(__dirname, "../dist");

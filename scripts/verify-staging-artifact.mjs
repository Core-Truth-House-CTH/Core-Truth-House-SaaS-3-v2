import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyStagingManifest } from "./staging-api-guard.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.length !== 3) throw new Error("Usage: npm run verify:staging -- <isolated-artifact-directory>");
const manifest = verifyStagingManifest(root, path.resolve(root, process.argv[2]));
console.log("Staging artifact integrity verified: " + manifest.files.length + " files; source " + manifest.commit);

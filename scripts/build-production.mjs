import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.length !== 2) throw new Error("Use npm run build:staging for staging; build does not accept mode/config overrides.");
if (process.env.CTH_BUILD_TARGET === "staging") throw new Error("Staging target requires npm run build:staging.");
execFileSync(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "build", "--config", "vite.config.js"], { cwd: root, stdio: "inherit" });

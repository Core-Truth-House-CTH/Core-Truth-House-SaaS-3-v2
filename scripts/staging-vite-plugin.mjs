import path from "node:path";
import { execFileSync } from "node:child_process";
import { preflightStaging, validateResolvedStagingConfig, assertIsolatedOutput, writeStagingManifest } from "./staging-api-guard.mjs";

export function stagingVitePlugin({ root, env, output }) {
  const origin = preflightStaging({ root, env });
  const outDir = assertIsolatedOutput(root, output, { mustBeNew: true });
  let resolved;
  return {
    name: "cth-staging-api-guard",
    enforce: "post",
    configResolved(config) {
      validateResolvedStagingConfig(config, origin, outDir);
      resolved = config;
    },
    closeBundle: {
      order: "post",
      sequential: true,
      handler() {
        if (!resolved) throw new Error("Staging API guard: Vite configuration was not verified");
        // Both direct Vite staging builds and the npm entry point use these exact postprocessors.
        const options = { cwd: root, env: { ...process.env, DIST_DIR: outDir }, stdio: "inherit" };
        execFileSync(process.execPath, [path.join(root, "scripts/create-route-html.cjs")], options);
        execFileSync(process.execPath, [path.join(root, "scripts/inject-static-route-metadata.mjs")], options);
        const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
        writeStagingManifest(root, outDir, origin, commit);
        console.log("Staging API guard: postprocessed artifact verified at " + path.relative(root, outDir));
      },
    },
  };
}

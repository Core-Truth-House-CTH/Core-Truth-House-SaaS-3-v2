// Usage: node scripts/staging-artifact-scan.mjs <artifact-dir>
import { assertArtifactClean } from "./staging-build-guard.mjs";

const dir = process.argv[2];
if (!dir || process.argv.length !== 3) {
  console.error("Usage: node scripts/staging-artifact-scan.mjs <artifact-dir>");
  process.exit(2);
}
try {
  const { files } = assertArtifactClean(dir);
  console.log(`Staging scan passed: ${files} text files, no production references, staging API address present.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(
  appRoot,
  "../mvp/frontend/src/schema/ceac-options/options.json",
);
const outputPath = resolve(appRoot, "src/lib/ceac-options.json");
const optionKeys = [
  "locations",
  "countriesBirth",
  "countriesNationality",
  "countriesAddress",
  "countriesPassportIssued",
  "countriesPassportIssuedIn",
  "usStates",
  "sex",
  "maritalStatus",
  "purposeOfTrip",
  "otherPurpose",
  "lengthOfStayUnit",
  "payingForTrip",
  "usContactRelationship",
  "passportType",
  "occupation",
];

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const selected = Object.fromEntries(
  optionKeys.map((key) => [key, source[key]]),
);
const generated = `${JSON.stringify(selected, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated) {
    console.error(
      "CEAC options are missing or stale. Run: npm run sync:ceac-options",
    );
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, generated);
  console.log(`Synced CEAC options to ${outputPath}`);
}

/**
 * Connect to an already-running Puppeteer Chrome and continue DS-160 pages
 * from the current page. Usage:
 *   node scripts/continue-from-browser.js [devtoolsPort]
 */
import puppeteer from "puppeteer";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = process.argv[2] || "58540";
const browserURL = `http://127.0.0.1:${port}`;

async function saveFieldInventory(page, filePath) {
  const fields = await page.evaluate(() => {
    const normalize = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
    return [...document.querySelectorAll("input, select, textarea")]
      .filter(
        (element) =>
          (element.id || element.name) &&
          !["hidden", "image"].includes((element.type || "").toLowerCase()),
      )
      .map((element) => ({
        id: element.id,
        name: element.name,
        type:
          element.tagName === "SELECT"
            ? "select"
            : element.type || element.tagName.toLowerCase(),
        label:
          normalize(
            [...(element.labels || [])]
              .map((label) => label.textContent)
              .join(" "),
          ) || null,
        options:
          element.tagName === "SELECT"
            ? [...element.options].map((option) => ({
                label: normalize(option.textContent),
                value: option.value,
              }))
            : undefined,
        value: element.type === "radio" || element.type === "checkbox"
          ? element.value
          : element.value || undefined,
        checked:
          element.type === "radio" || element.type === "checkbox"
            ? element.checked
            : undefined,
      }));
  });

  await mkdir(resolve("data"), { recursive: true, mode: 0o700 });
  const payload = {
    pageTitle: await page.title(),
    url: page.url(),
    savedAt: new Date().toISOString(),
    heading: await page.evaluate(() => {
      const h = document.querySelector("h1, h2, .title, #lblPageTitle");
      return h?.textContent?.replace(/\s+/g, " ").trim() ?? null;
    }),
    bodySnippet: await page.evaluate(() => {
      const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
      // Pull the form question area roughly
      const match = text.match(
        /Travel Companions[\s\S]{0,2500}?Previous U\.S\. Travel|Are there other persons[\s\S]{0,2000}?Save|Previous U\.S\. Travel[\s\S]{0,2000}?Save/,
      );
      return (match?.[0] || text.slice(0, 2000)).slice(0, 2500);
    }),
    fields,
  };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(filePath, 0o600);
  return payload;
}

async function chooseRadioByPartialId(page, partialId, value) {
  const selected = await page.evaluate(
    (partial, requestedValue) => {
      const normalize = (candidate) =>
        candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const requested = normalize(requestedValue);
      const aliases = { YES: "Y", NO: "N" };
      const expected = aliases[requested] ?? requested;
      const candidates = [
        ...document.querySelectorAll('input[type="radio"]'),
      ].filter(
        (candidate) =>
          candidate.id.includes(partial) || candidate.name.includes(partial),
      );
      const target = candidates.find(
        (candidate) =>
          normalize(candidate.value) === expected ||
          [...candidate.labels].some(
            (label) => normalize(label.textContent) === requested,
          ),
      );
      if (!target) return false;
      target.click();
      return true;
    },
    partialId,
    value,
  );
  if (!selected) {
    throw new Error(`Radio ${partialId}=${value} not found`);
  }
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL,
    defaultViewport: null,
  });
  const pages = await browser.pages();
  const page =
    pages.find((p) => p.url().includes("ceac.state.gov")) || pages[0];
  page.setDefaultTimeout(30_000);

  console.log(`Connected to ${page.url()}`);
  console.log(`Title: ${await page.title()}`);

  const out = resolve("data/travel-companions.fields.json");
  const inventory = await saveFieldInventory(page, out);
  console.log(`Saved baseline inventory (${inventory.fields.length} fields) -> ${out}`);
  console.log("Heading:", inventory.heading);
  console.log(
    "Form fields (id / type / label / value):",
  );
  for (const f of inventory.fields) {
    if (
      f.id?.includes("ddlLanguage") ||
      f.id?.includes("ddlSite") ||
      f.type === "submit" ||
      f.type === "button"
    ) {
      continue;
    }
    const opts = f.options
      ? ` options=[${f.options.map((o) => o.value || o.label).join("|")}]`
      : "";
    console.log(
      `  - ${f.id || f.name} | ${f.type} | ${f.label || "-"} | ${f.value ?? ""}${f.checked !== undefined ? ` checked=${f.checked}` : ""}${opts}`,
    );
  }

  // Keep connection open for further steps — disconnect without closing browser
  await browser.disconnect();
  console.log("Disconnected (browser left open).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

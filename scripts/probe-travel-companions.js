/**
 * Probe Travel Companions conditionals on the live CEAC page.
 */
import puppeteer from "puppeteer";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = process.argv[2] || "58540";

async function saveFieldInventory(page, filePath, extra = {}) {
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
        value:
          element.type === "radio" || element.type === "checkbox"
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
    ...extra,
    fields,
  };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(filePath, 0o600);
  return payload;
}

function summarizeFields(fields) {
  return fields
    .filter(
      (f) =>
        !f.id?.includes("ddlLanguage") &&
        !f.id?.includes("ddlSite") &&
        f.type !== "submit" &&
        f.type !== "button",
    )
    .map((f) => {
      const opts = f.options
        ? ` options=[${f.options
            .slice(0, 20)
            .map((o) => `${o.value}:${o.label}`)
            .join(" | ")}${f.options.length > 20 ? " ..." : ""}]`
        : "";
      return `${f.id || f.name} | ${f.type} | ${f.label || "-"} | val=${f.value ?? ""}${f.checked !== undefined ? ` checked=${f.checked}` : ""}${opts}`;
    });
}

async function getCeacPage(browser) {
  const pages = await browser.pages();
  return (
    pages.find((p) => p.url().includes("TravelCompanions")) ||
    pages.find((p) => p.url().includes("ceac.state.gov")) ||
    pages[0]
  );
}

async function clickRadioPartial(browser, partial, value) {
  let page = await getCeacPage(browser);
  const postback = page
    .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 })
    .catch(() => null);

  const ok = await page.evaluate(
    (partialId, requestedValue) => {
      const normalize = (c) => c?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const requested = normalize(requestedValue);
      const aliases = { YES: "Y", NO: "N" };
      const expected = aliases[requested] ?? requested;
      const candidates = [
        ...document.querySelectorAll('input[type="radio"]'),
      ].filter(
        (c) => c.id.includes(partialId) || c.name.includes(partialId),
      );
      const target = candidates.find(
        (c) =>
          normalize(c.value) === expected ||
          [...c.labels].some((l) => normalize(l.textContent) === requested),
      );
      if (!target) return false;
      target.click();
      return true;
    },
    partial,
    value,
  );
  if (!ok) throw new Error(`Radio ${partial}=${value} missing`);
  await postback;
  await new Promise((r) => setTimeout(r, 1000));
  page = await getCeacPage(browser);
  return page;
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${port}`,
    defaultViewport: null,
  });
  let page = await getCeacPage(browser);

  console.log("Current:", page.url());

  // Probe YES on other persons
  console.log("\n=== Selecting YES: other persons traveling with you ===");
  page = await clickRadioPartial(
    browser,
    "rblOtherPersonsTravelingWithYou",
    "YES",
  );
  let inv = await saveFieldInventory(
    page,
    resolve("data/travel-companions.yes.fields.json"),
    { branch: "otherPersons=YES" },
  );
  console.log(summarizeFields(inv.fields).join("\n"));

  const hasGroup = inv.fields.some((f) =>
    /rblGroupTravel/i.test(`${f.id} ${f.name}`),
  );
  if (hasGroup) {
    console.log("\n=== Selecting YES: group/org (rblGroupTravel) ===");
    page = await clickRadioPartial(browser, "rblGroupTravel", "YES");
    inv = await saveFieldInventory(
      page,
      resolve("data/travel-companions.group-yes.fields.json"),
      { branch: "otherPersons=YES, group=YES" },
    );
    console.log(summarizeFields(inv.fields).join("\n"));

    console.log("\n=== Selecting NO: group/org (rblGroupTravel) ===");
    page = await clickRadioPartial(browser, "rblGroupTravel", "NO");
    inv = await saveFieldInventory(
      page,
      resolve("data/travel-companions.group-no.fields.json"),
      { branch: "otherPersons=YES, group=NO" },
    );
    console.log(summarizeFields(inv.fields).join("\n"));
  } else {
    console.log("No group/organization radio found after YES.");
  }

  // Reset to NO for test fill
  console.log("\n=== Resetting to NO: other persons ===");
  page = await clickRadioPartial(
    browser,
    "rblOtherPersonsTravelingWithYou",
    "NO",
  );
  inv = await saveFieldInventory(
    page,
    resolve("data/travel-companions.fields.json"),
    {
      branch: "otherPersons=NO (test default)",
      conditionals: {
        otherPersonsYes:
          "Reveals: Are you traveling as part of a group or organization? (rblGroupTravel)",
        groupYes: "Reveals group name text field",
        groupNo:
          "Reveals companion surname, given names, and relationship fields (+ Add Another)",
      },
    },
  );
  console.log(summarizeFields(inv.fields).join("\n"));

  await browser.disconnect();
  console.log("\nDone probing. Browser left open.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Advance through DS-160 review pages by clicking Next.
 * Stops before Sign/Submit attestation — does not submit the application.
 *
 * Usage: node scripts/advance-review.js [devtoolsPort]
 */
import puppeteer from "puppeteer";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { resolve } from "node:path";

const port = process.argv[2] || "61593";

async function getPage(browser) {
  const pages = await browser.pages();
  return (
    pages.find((p) => p.url().includes("ceac.state.gov")) || pages[0]
  );
}

async function clickNextLike(page) {
  const previousUrl = page.url();
  const navigationPromise = page
    .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => null);

  const clicked = await page.evaluate(() => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
    const buttons = [
      ...document.querySelectorAll(
        'input[type="submit"], input[type="button"], button, a',
      ),
    ];
    const preferred = buttons.find((btn) => {
      const text = normalize(btn.value || btn.textContent);
      const id = btn.id || "";
      return (
        id.includes("btnNextPageComplete") ||
        id.includes("UpdateButton3") ||
        text.startsWith("NEXT") ||
        text === "CONTINUE" ||
        text.includes("NEXT:")
      );
    });
    if (!preferred) return null;
    preferred.scrollIntoView({ block: "center" });
    preferred.click();
    return preferred.value || preferred.textContent || preferred.id;
  });

  if (!clicked) {
    throw new Error("No Next/Continue control found");
  }
  await navigationPromise;
  await new Promise((r) => setTimeout(r, 600));
  return { previousUrl, clicked, url: page.url(), title: await page.title() };
}

async function pageMeta(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    return {
      url: location.href,
      title: document.title,
      node: new URL(location.href).searchParams.get("node"),
      hasSignLanguage:
        /under penalty of perjury|I understand.*certify|Sign and Submit/i.test(
          text,
        ),
      hasPhoto: /Upload|Photograph|Photo Quality/i.test(text),
      snippet: text.slice(0, 400),
    };
  });
}

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${port}`,
    defaultViewport: null,
  });
  let page = await getPage(browser);
  page.setDefaultTimeout(30_000);
  page.on("dialog", async (dialog) => {
    console.log(`Dialog: ${dialog.message()}`);
    try {
      await dialog.accept();
    } catch {
      // Dialog may already be dismissed by a concurrent handler
    }
  });

  console.log(`Connected: ${page.url()}`);

  for (let step = 0; step < 20; step += 1) {
    page = await getPage(browser);
    const meta = await pageMeta(page);
    console.log(`\n=== Review step ${step + 1}: ${meta.title} (${meta.node}) ===`);

    // Stop before legal attestation / final submit
    if (
      /SignConfirm|Sign_?Submit|ElectronicSignature|Confirm/i.test(
        `${meta.node} ${meta.url}`,
      ) ||
      meta.hasSignLanguage
    ) {
      await mkdir(resolve("data"), { recursive: true, mode: 0o700 });
      const out = resolve("data/review-sign-stop.json");
      await writeFile(
        out,
        `${JSON.stringify({ ...meta, stoppedAt: new Date().toISOString() }, null, 2)}\n`,
        { mode: 0o600 },
      );
      await chmod(out, 0o600);
      console.log(
        "Stopped before Sign & Submit. Browser left open for manual review.",
      );
      console.log(`State saved to ${out}`);
      break;
    }

    // Photo upload page: try Next/skip if available; otherwise stop for manual upload
    if (/Photo|UploadPhoto/i.test(`${meta.node} ${meta.title}`) || meta.hasPhoto) {
      console.log("Photo page detected — attempting to continue if allowed...");
    }

    try {
      const result = await clickNextLike(page);
      console.log(`Clicked "${result.clicked}" → ${result.url}`);
    } catch (error) {
      console.error(`Could not advance: ${error.message}`);
      const metaAfter = await pageMeta(page);
      console.log(metaAfter.snippet);
      break;
    }
  }

  await browser.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

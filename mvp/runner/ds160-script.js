import "dotenv/config";
import puppeteer from "puppeteer";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DS160_SELECTORS } from "./selectors.js";
import {
  jobContext,
  configureJobContext,
  workspacePath,
} from "./job-context.js";

const DS160_URL = "https://ceac.state.gov/GenNIV/Default.aspx";
const LOCATION_SELECTOR = DS160_SELECTORS.location.dropdown;
const CAPTCHA_SELECTOR = DS160_SELECTORS.captcha.input;
const START_APPLICATION_SELECTOR = DS160_SELECTORS.navigation.startApplication;
const SECURITY_QUESTION = "WHAT IS THE GIVEN NAME OF YOUR MOTHER'S MOTHER?";
const SESSION_FILE = () => workspacePath("data/session.json");
const PERSONAL_INFO_1_FIELDS_FILE = () =>
  workspacePath("data/personal-information-1.fields.json");
const PERSONAL_INFO_1_TEST_DATA_FILE = () =>
  workspacePath("fixtures/personal-information-1.test.json");
const PERSONAL_INFO_2_FIELDS_FILE = () =>
  workspacePath("data/personal-information-2.fields.json");
const PERSONAL_INFO_2_TEST_DATA_FILE = () =>
  workspacePath("fixtures/personal-information-2.test.json");
const TRAVEL_INFO_FIELDS_FILE = () =>
  workspacePath("data/travel-information.fields.json");
const TRAVEL_INFO_TEST_DATA_FILE = () =>
  workspacePath("fixtures/travel-information.test.json");
const TRAVEL_COMPANIONS_FIELDS_FILE = () =>
  workspacePath("data/travel-companions.fields.json");
const TRAVEL_COMPANIONS_YES_FIELDS_FILE = () =>
  workspacePath("data/travel-companions.yes.fields.json");
const TRAVEL_COMPANIONS_GROUP_YES_FIELDS_FILE = () =>
  workspacePath("data/travel-companions.group-yes.fields.json");
const TRAVEL_COMPANIONS_GROUP_NO_FIELDS_FILE = () =>
  workspacePath("data/travel-companions.group-no.fields.json");
const TRAVEL_COMPANIONS_TEST_DATA_FILE = () =>
  workspacePath("fixtures/travel-companions.test.json");
const PREVIOUS_US_TRAVEL_FIELDS_FILE = () =>
  workspacePath("data/previous-us-travel.fields.json");
const PREVIOUS_US_TRAVEL_TEST_DATA_FILE = () =>
  workspacePath("fixtures/previous-us-travel.test.json");
const ADDRESS_PHONE_FIELDS_FILE = () =>
  workspacePath("data/address-phone.fields.json");
const ADDRESS_PHONE_TEST_DATA_FILE = () =>
  workspacePath("fixtures/address-phone.test.json");
const PASSPORT_FIELDS_FILE = () => workspacePath("data/passport.fields.json");
const PASSPORT_TEST_DATA_FILE = () =>
  workspacePath("fixtures/passport.test.json");
const US_CONTACT_FIELDS_FILE = () =>
  workspacePath("data/us-contact.fields.json");
const US_CONTACT_TEST_DATA_FILE = () =>
  workspacePath("fixtures/us-contact.test.json");
const FAMILY_FIELDS_FILE = () => workspacePath("data/family.fields.json");
const FAMILY_TEST_DATA_FILE = () => workspacePath("fixtures/family.test.json");
const WORK_EDUCATION_FIELDS_FILE = () =>
  workspacePath("data/work-education.fields.json");
const WORK_EDUCATION_TEST_DATA_FILE = () =>
  workspacePath("fixtures/work-education.test.json");
const SECURITY_BACKGROUND_FIELDS_FILE = () =>
  workspacePath("data/security-background.fields.json");
const SECURITY_BACKGROUND_TEST_DATA_FILE = () =>
  workspacePath("fixtures/security-background.test.json");
const SIGN_SUBMIT_FIELDS_FILE = () =>
  workspacePath("data/sign-submit.fields.json");
const SIGN_SUBMIT_TEST_DATA_FILE = () =>
  workspacePath("fixtures/sign-submit.test.json");
const CONFIRMATION_FIELDS_FILE = () =>
  workspacePath("data/confirmation.fields.json");

const locationCode = () =>
  jobContext.locationCode || process.env.DS160_LOCATION || "HYD";
// Headless by default. Set HEADLESS=false to watch the browser.
const headless = process.env.HEADLESS !== "false";
const securityAnswer = () =>
  jobContext.securityAnswer ||
  process.env.DS160_SECURITY_ANSWER?.trim() ||
  "TestAnswer";
const resumeApplication = () =>
  jobContext.resumeApplication ||
  process.env.DS160_RESUME === "true" ||
  process.env.DS160_RESUME === "1";
const retrieveApplicationSelector = "#ctl00_SiteContentPlaceHolder_lnkRetrieve";
const CAPTCHA_FILE = () => workspacePath("data/captcha.txt");
const CAPTCHA_IMAGE_FILE = () => workspacePath("data/captcha.png");
const CAPTCHA_IMAGE_SELECTOR = DS160_SELECTORS.captcha.image;
// Re-probe conditional branches (slow). Default off once inventories exist.
const probeConditionals =
  process.env.DS160_PROBE === "true" || process.env.DS160_PROBE === "1";
// Persist field inventories on every known page. Default off for speed.
const saveInventories =
  process.env.DS160_SAVE_INVENTORY === "true" ||
  process.env.DS160_SAVE_INVENTORY === "1";
// Required to click "Sign and Submit Application" on SignCertify.
const allowSubmit = () =>
  jobContext.allowSubmit ||
  process.env.DS160_ALLOW_SUBMIT === "true" ||
  process.env.DS160_ALLOW_SUBMIT === "1";
// Verbose timing logs (default on). Set DS160_VERBOSE=false to quiet.
const verboseTiming = process.env.DS160_VERBOSE !== "false";
// Max wait for CEAC radio postbacks (most are UpdatePanel / no full nav).
const postbackTimeoutMs = Number(process.env.DS160_POSTBACK_MS) || 2_500;
// Selects like ddlPresentOccupation often full-navigate (~3s); allow longer.
const selectPostbackTimeoutMs =
  Number(process.env.DS160_SELECT_POSTBACK_MS) || 10_000;
// Brief pause after a postback settles (or after confirming none fired).
const postbackSettleMs = Number(process.env.DS160_SETTLE_MS) || 150;

const runStartedAt = Date.now();
let lastLogAt = runStartedAt;
const stepTimings = [];

function formatMs(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function log(...args) {
  if (!verboseTiming) {
    console.log(...args);
    return;
  }
  const now = Date.now();
  const total = now - runStartedAt;
  const delta = now - lastLogAt;
  lastLogAt = now;
  console.log(`[t+${formatMs(total)} Δ${formatMs(delta)}]`, ...args);
}

async function timed(label, fn) {
  const start = Date.now();
  log(`→ START ${label}`);
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    stepTimings.push({ label, elapsedMs: elapsed, ok: true });
    log(`← DONE  ${label} in ${formatMs(elapsed)}`);
    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    stepTimings.push({
      label,
      elapsedMs: elapsed,
      ok: false,
      error: error.message,
    });
    log(`✗ FAIL  ${label} after ${formatMs(elapsed)}: ${error.message}`);
    throw error;
  }
}

async function sleep(ms, reason = "wait") {
  if (verboseTiming) {
    log(`… sleeping ${ms}ms — ${reason}`);
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isAspNetAsyncPostBack(page) {
  try {
    return await page.evaluate(() => {
      try {
        return Boolean(
          window.Sys?.WebForms?.PageRequestManager?.getInstance?.()?.get_isInAsyncPostBack?.(),
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * After a radio/select that may trigger CEAC ASP.NET postback.
 * Uses framenavigated + UpdatePanel polling — does NOT leave orphaned
 * waitForNavigation watchers (those race the next clickNext and crash).
 *
 * Radios: allowEarlyExit=true (default) — bail after grace if nothing happens.
 * Selects: allowEarlyExit=false — wait out timeoutMs for real navigations
 * (e.g. ddlPresentOccupation ~3s).
 */
async function settleAfterPossiblePostback(
  page,
  label = "postback",
  options = {},
) {
  const {
    allowEarlyExit = true,
    timeoutMs = postbackTimeoutMs,
    graceMs = 400,
  } = options;
  const start = Date.now();
  let wasBusy = false;
  let sawNavigation = false;

  const onFrameNavigated = (frame) => {
    if (frame === page.mainFrame()) {
      sawNavigation = true;
    }
  };
  page.on("framenavigated", onFrameNavigated);

  const finish = async (outcome) => {
    page.off("framenavigated", onFrameNavigated);
    log(`  ${label}: ${outcome} in ${formatMs(Date.now() - start)}`);
    if (outcome === "navigated" || outcome === "ajax-done") {
      await sleep(postbackSettleMs, `settle after ${outcome} ${label}`);
    } else {
      await sleep(Math.min(postbackSettleMs, 100), `brief settle ${label}`);
    }
    return outcome;
  };

  try {
    while (Date.now() - start < timeoutMs) {
      if (sawNavigation) {
        await page
          .waitForFunction(
            () =>
              document.readyState === "interactive" ||
              document.readyState === "complete",
            { timeout: 15_000 },
          )
          .catch(() => null);
        return finish("navigated");
      }

      let busy = false;
      try {
        busy = await isAspNetAsyncPostBack(page);
      } catch {
        // Execution context destroyed — full navigation in flight
        await page
          .waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: Math.max(2_000, timeoutMs - (Date.now() - start)),
          })
          .catch(() => null);
        await page
          .waitForFunction(
            () =>
              document.readyState === "interactive" ||
              document.readyState === "complete",
            { timeout: 15_000 },
          )
          .catch(() => null);
        return finish("navigated");
      }

      if (busy) {
        wasBusy = true;
      } else if (wasBusy) {
        return finish("ajax-done");
      } else if (allowEarlyExit && Date.now() - start >= graceMs) {
        // Dialogs often fire just before a slow full nav — brief extra watch
        const extraUntil = Date.now() + 500;
        while (Date.now() < extraUntil) {
          if (sawNavigation) {
            break;
          }
          try {
            if (await isAspNetAsyncPostBack(page)) {
              wasBusy = true;
              break;
            }
          } catch {
            sawNavigation = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        if (sawNavigation || wasBusy) {
          continue;
        }
        return finish("no-postback");
      }

      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    if (sawNavigation) {
      return finish("navigated");
    }
    return finish(wasBusy ? "ajax-timeout" : "timeout");
  } catch (error) {
    page.off("framenavigated", onFrameNavigated);
    throw error;
  }
}

async function logPageState(page, label = "page") {
  try {
    const state = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      node: new URL(location.href).searchParams.get("node"),
      readyState: document.readyState,
      controlCount: document.querySelectorAll("input, select, textarea").length,
    }));
    log(
      `${label}: node=${state.node || "-"} title="${state.title}" controls=${state.controlCount} ready=${state.readyState}`,
    );
    log(`  url=${state.url}`);
    return state;
  } catch (error) {
    log(`${label}: could not read page state (${error.message})`);
    return null;
  }
}

function printTimingSummary() {
  if (!verboseTiming || stepTimings.length === 0) {
    return;
  }
  const sorted = [...stepTimings].sort((a, b) => b.elapsedMs - a.elapsedMs);
  log("—— Timing summary (slowest first) ——");
  for (const entry of sorted.slice(0, 25)) {
    const status = entry.ok ? "ok" : "FAIL";
    log(
      `  ${formatMs(entry.elapsedMs).padStart(8)}  [${status}]  ${entry.label}`,
    );
  }
  const totalTracked = stepTimings.reduce(
    (sum, entry) => sum + entry.elapsedMs,
    0,
  );
  log(
    `Tracked steps: ${stepTimings.length}, sum=${formatMs(totalTracked)}, wall=${formatMs(Date.now() - runStartedAt)}`,
  );
}

async function maybeSaveFieldInventory(page, filePath, force = false) {
  if (!force && !saveInventories && !probeConditionals) {
    log(`skip inventory save (${filePath.split("/").pop()})`);
    return;
  }
  await timed(`saveFieldInventory → ${filePath.split("/").pop()}`, () =>
    saveFieldInventory(page, filePath),
  );
}

async function clearCaptchaFile() {
  await mkdir(workspacePath("data"), { recursive: true, mode: 0o700 });
  await writeFile(
    CAPTCHA_FILE(),
    [
      `# Open ${CAPTCHA_IMAGE_FILE()} to view the CAPTCHA image.`,
      "# Type the code on the next line, then save this file.",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
}

async function readCaptchaFromFile() {
  try {
    const raw = await readFile(CAPTCHA_FILE(), "utf8");
    const line = raw
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry && !entry.startsWith("#"));
    return line || "";
  } catch {
    return "";
  }
}

async function saveCaptchaImage(page) {
  await mkdir(workspacePath("data"), { recursive: true, mode: 0o700 });

  // Wait until a CAPTCHA <img> has actually loaded pixels (avoids 0-width screenshot)
  await page
    .waitForFunction(
      (preferred) => {
        const preferredImg = preferred
          ? document.querySelector(preferred)
          : null;
        const candidates = preferredImg
          ? [preferredImg, ...document.querySelectorAll("img")]
          : [...document.querySelectorAll("img")];
        return candidates.some((img) => {
          if (!img || img.tagName !== "IMG") {
            return false;
          }
          const hint = `${img.id} ${img.src} ${img.alt} ${img.className}`;
          const looksLikeCaptcha =
            img === preferredImg ||
            /captcha|validat|lbd_img|security.?code/i.test(hint);
          return (
            looksLikeCaptcha &&
            img.complete &&
            img.naturalWidth > 10 &&
            img.naturalHeight > 10
          );
        });
      },
      { timeout: 20_000 },
      CAPTCHA_IMAGE_SELECTOR,
    )
    .catch(() => null);

  // Prefer canvas export (works even when CSS width is 0 / offscreen)
  const dataUrl = await page.evaluate((preferred) => {
    const preferredImg = preferred ? document.querySelector(preferred) : null;
    const imgs = [preferredImg, ...document.querySelectorAll("img")].filter(
      Boolean,
    );
    const match = imgs.find((img) => {
      const hint = `${img.id} ${img.src} ${img.alt} ${img.className}`;
      const looksLikeCaptcha =
        img === preferredImg ||
        /captcha|validat|lbd_img|security.?code/i.test(hint);
      return (
        looksLikeCaptcha &&
        img.complete &&
        img.naturalWidth > 10 &&
        img.naturalHeight > 10
      );
    });
    if (!match) {
      return null;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = match.naturalWidth;
      canvas.height = match.naturalHeight;
      canvas.getContext("2d").drawImage(match, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      return { src: match.src };
    }
  }, CAPTCHA_IMAGE_SELECTOR);

  if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
    const base64 = dataUrl.split(",")[1];
    await writeFile(CAPTCHA_IMAGE_FILE(), Buffer.from(base64, "base64"), {
      mode: 0o600,
    });
    await chmod(CAPTCHA_IMAGE_FILE(), 0o600);
    log(`CAPTCHA image saved to ${CAPTCHA_IMAGE_FILE()}`);
    return CAPTCHA_IMAGE_FILE();
  }

  // Fetch image bytes in-page (same cookies / session as CEAC)
  const src = dataUrl && typeof dataUrl === "object" ? dataUrl.src : null;
  const fetched = src
    ? await page.evaluate(async (imageSrc) => {
        const response = await fetch(imageSrc, { credentials: "include" });
        if (!response.ok) {
          return null;
        }
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        return btoa(binary);
      }, src)
    : null;

  if (fetched) {
    await writeFile(CAPTCHA_IMAGE_FILE(), Buffer.from(fetched, "base64"), {
      mode: 0o600,
    });
    await chmod(CAPTCHA_IMAGE_FILE(), 0o600);
    log(`CAPTCHA image saved to ${CAPTCHA_IMAGE_FILE()} (via fetch)`);
    return CAPTCHA_IMAGE_FILE();
  }

  // Last resort: screenshot only if the element has a real box
  const selectors = [
    CAPTCHA_IMAGE_SELECTOR,
    'img[id*="imgCaptcha" i]',
    'img[id*="Captcha" i]',
    'img[src*="Captcha" i]',
    'img[alt*="CAPTCHA" i]',
    'img[id*="LBD_IMG" i]',
  ];
  for (const selector of selectors) {
    try {
      const handle = await page.$(selector);
      if (!handle) {
        continue;
      }
      const box = await handle.boundingBox();
      if (!box || box.width < 10 || box.height < 10) {
        await handle.dispose();
        continue;
      }
      await handle.screenshot({ path: CAPTCHA_IMAGE_FILE() });
      await chmod(CAPTCHA_IMAGE_FILE(), 0o600);
      await handle.dispose();
      log(`CAPTCHA image saved to ${CAPTCHA_IMAGE_FILE()} (screenshot)`);
      return CAPTCHA_IMAGE_FILE();
    } catch {
      // try next
    }
  }

  throw new Error(
    `Could not save CAPTCHA image (not loaded or 0-size) on ${page.url()}.`,
  );
}

async function promptForCaptcha(page) {
  return timed("wait for CAPTCHA", async () => {
    const fromEnv = process.env.DS160_CAPTCHA?.trim();
    if (fromEnv) {
      log("CAPTCHA provided via DS160_CAPTCHA env");
      return fromEnv;
    }

    await saveCaptchaImage(page);
    const imageBuffer = await readFile(CAPTCHA_IMAGE_FILE());
    log("CAPTCHA image ready — invoking onCaptchaNeeded hook");
    if (jobContext.hooks.onStatus) {
      await jobContext.hooks.onStatus("awaiting_captcha");
    }
    const answer = await jobContext.hooks.onCaptchaNeeded(imageBuffer);
    const trimmed = String(answer ?? "").trim();
    if (!trimmed) {
      throw new Error("onCaptchaNeeded returned an empty CAPTCHA answer");
    }
    log("CAPTCHA answer received from hook");
    if (jobContext.hooks.onStatus) {
      await jobContext.hooks.onStatus("filling");
    }
    return trimmed;
  });
}

async function saveApplicationId(applicationId) {
  jobContext.lastApplicationId = applicationId;
  await mkdir(workspacePath("data"), { recursive: true, mode: 0o700 });
  await writeFile(
    SESSION_FILE(),
    `${JSON.stringify(
      {
        applicationId,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(SESSION_FILE(), 0o600);
}

async function clickAgreement(page) {
  const selector = await page.evaluate(() => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
    const candidates = [
      ...document.querySelectorAll(
        'input[type="checkbox"], input[type="radio"]',
      ),
    ];
    const target =
      candidates.find((candidate) =>
        [...candidate.labels].some((label) =>
          normalize(label.textContent).includes("I AGREE"),
        ),
      ) ??
      candidates.find((candidate) =>
        normalize(candidate.value).includes("I AGREE"),
      ) ??
      (candidates.length === 1 ? candidates[0] : null);

    if (!target) {
      return null;
    }

    if (!target.id) {
      target.id = "ds160-agreement-control";
    }
    return `#${CSS.escape(target.id)}`;
  });

  if (!selector) {
    throw new Error('Could not find the "I Agree" checkbox.');
  }

  await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    }),
    page.click(selector),
  ]);
}

async function configureSecurityQuestion(page) {
  const questionSelected = await page.evaluate((questionText) => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";

    for (const select of document.querySelectorAll("select")) {
      const option = [...select.options].find(
        (candidate) => normalize(candidate.textContent) === questionText,
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }, SECURITY_QUESTION);

  if (!questionSelected) {
    throw new Error(`Could not find security question: ${SECURITY_QUESTION}`);
  }

  const answerSelector = await page.evaluate(() => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
    const candidates = [
      ...document.querySelectorAll(
        'input[type="text"], input:not([type]), textarea',
      ),
    ];
    const target =
      candidates.find((candidate) =>
        [...candidate.labels].some((label) =>
          normalize(label.textContent).includes("ANSWER"),
        ),
      ) ?? (candidates.length === 1 ? candidates[0] : null);

    if (!target) {
      return null;
    }
    if (!target.id) {
      target.id = "ds160-security-answer";
    }
    return `#${CSS.escape(target.id)}`;
  });

  if (!answerSelector) {
    throw new Error("Could not find the security-answer input.");
  }

  await page.type(answerSelector, securityAnswer());
}

async function readApplicationId(page) {
  const applicationId = await page.$eval("body", (body) => {
    const text = body.innerText.replace(/\s+/g, " ");
    return (
      text.match(/APPLICATION\s+ID\s*:?\s*(AA[A-Z0-9]{8,})/i)?.[1] ??
      text.match(/\bAA[A-Z0-9]{8,}\b/i)?.[0] ??
      null
    );
  });

  if (!applicationId) {
    throw new Error("Could not read the generated Application ID.");
  }
  return applicationId.toUpperCase();
}

async function clickContinue(page) {
  const selector = await page.evaluate(() => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
    const candidates = [
      ...document.querySelectorAll(
        'button, input[type="submit"], input[type="button"], a',
      ),
    ];
    const target = candidates.find(
      (candidate) =>
        normalize(candidate.textContent || candidate.value) === "CONTINUE",
    );

    if (!target) {
      return null;
    }
    if (!target.id) {
      target.id = "ds160-continue";
    }
    return `#${CSS.escape(target.id)}`;
  });

  if (!selector) {
    throw new Error('Could not find the "Continue" control.');
  }

  await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    }),
    page.click(selector),
  ]);
}

async function selectorForPartialId(page, partialId) {
  return page.evaluate((partial) => {
    const target =
      document.getElementById(partial) ??
      document.querySelector(`[id$="_${CSS.escape(partial)}"]`) ??
      document.querySelector(`[id*="${CSS.escape(partial)}"]`) ??
      document.querySelector(`[name*="${CSS.escape(partial)}"]`);

    if (!target) {
      return null;
    }
    if (!target.id) {
      target.id = `ds160-${partial}`;
    }
    return `#${CSS.escape(target.id)}`;
  }, partialId);
}

async function requireSelector(page, partialId) {
  const selector = await selectorForPartialId(page, partialId);
  if (!selector) {
    throw new Error(`Could not find DS-160 control: ${partialId}`);
  }
  return selector;
}

async function fillTextByPartialId(page, partialId, value) {
  const selector = await requireSelector(page, partialId);
  await page.$eval(
    selector,
    (element, fieldValue) => {
      element.value = fieldValue;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));
    },
    value,
  );
}

async function selectByPartialId(page, partialId, value) {
  const selector = await requireSelector(page, partialId);
  const selected = await page.$eval(
    selector,
    (select, requestedValue) => {
      const normalize = (candidate) =>
        candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const requested = normalize(requestedValue);
      const option = [...select.options].find(
        (candidate) =>
          normalize(candidate.value) === requested ||
          normalize(candidate.textContent) === requested,
      );

      if (!option) {
        return false;
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    value,
  );

  if (!selected) {
    throw new Error(
      `Value "${value}" is not available for field ${partialId}.`,
    );
  }
}

async function chooseRadioByPartialId(page, partialId, value) {
  const selected = await page.evaluate(
    (partial, requestedValue) => {
      const normalize = (candidate) =>
        candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const requested = normalize(requestedValue);
      const aliases = {
        YES: "Y",
        NO: "N",
        MALE: "M",
        FEMALE: "F",
      };
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

      if (!target) {
        return "missing";
      }
      if (target.checked) {
        return "already";
      }
      target.click();
      return "clicked";
    },
    partialId,
    value,
  );

  if (selected === "missing" || selected === false) {
    throw new Error(
      `Value "${value}" is not available for field ${partialId}.`,
    );
  }
  return selected;
}

async function chooseRadioWithPostback(page, partialId, value) {
  return timed(`radio postback ${partialId}=${value}`, async () => {
    const result = await chooseRadioByPartialId(page, partialId, value);
    if (result === "already") {
      log(`  ${partialId} already ${value} — skip settle`);
      return;
    }
    await settleAfterPossiblePostback(page, partialId);
  });
}

async function pageHasPartialId(page, partialId) {
  return page.evaluate(
    (partial) =>
      [...document.querySelectorAll("input, select, textarea")].some(
        (element) =>
          element.id.includes(partial) || element.name.includes(partial),
      ),
    partialId,
  );
}

async function summarizeFormControls(page) {
  return page.evaluate(() => {
    const normalize = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
    return [...document.querySelectorAll("input, select, textarea")]
      .filter(
        (element) =>
          (element.id || element.name) &&
          !["hidden", "image", "submit", "button"].includes(
            (element.type || "").toLowerCase(),
          ) &&
          !/ddlLanguage|ddlSite/i.test(element.id || ""),
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
            ? [...element.options].slice(0, 40).map((option) => ({
                label: normalize(option.textContent),
                value: option.value,
              }))
            : undefined,
        value: element.value,
        checked:
          element.type === "radio" || element.type === "checkbox"
            ? element.checked
            : undefined,
      }));
  });
}

async function answerAllVisibleYesNoRadios(page, value = "NO") {
  return timed(`answerAllVisibleYesNoRadios → ${value}`, async () => {
    const groups = await page.evaluate(() => {
      const seen = new Set();
      const names = [];
      for (const radio of document.querySelectorAll('input[type="radio"]')) {
        if (!radio.name || seen.has(radio.name)) {
          continue;
        }
        const group = [
          ...document.querySelectorAll(
            `input[type="radio"][name="${CSS.escape(radio.name)}"]`,
          ),
        ];
        const values = group.map((candidate) =>
          (candidate.value || "").toUpperCase(),
        );
        if (
          (values.includes("Y") || values.includes("YES")) &&
          (values.includes("N") || values.includes("NO"))
        ) {
          seen.add(radio.name);
          names.push(radio.name);
        }
      }
      return names;
    });

    log(`  found ${groups.length} Yes/No radio group(s)`);
    let clickedCount = 0;
    for (const [index, name] of groups.entries()) {
      const shortName = name.split("$").pop() || name;
      const clicked = await page.evaluate(
        (radioName, requested) => {
          const normalize = (candidate) =>
            candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
          const aliases = { YES: "Y", NO: "N" };
          const expected =
            aliases[normalize(requested)] ?? normalize(requested);
          const target = [
            ...document.querySelectorAll(
              `input[type="radio"][name="${CSS.escape(radioName)}"]`,
            ),
          ].find((candidate) => normalize(candidate.value) === expected);
          if (!target) {
            return "missing";
          }
          if (target.checked) {
            return "already";
          }
          target.click();
          return "clicked";
        },
        name,
        value,
      );
      log(`  [${index + 1}/${groups.length}] ${shortName} → ${clicked}`);
      if (clicked === "clicked") {
        clickedCount += 1;
        await settleAfterPossiblePostback(page, shortName);
      }
    }
    log(`  Yes/No pass complete (clicked ${clickedCount}/${groups.length})`);
    return groups.length;
  });
}

async function setCheckboxByPartialId(page, partialId, checked) {
  const selector = await requireSelector(page, partialId);
  await page.$eval(
    selector,
    (checkbox, shouldBeChecked) => {
      if (checkbox.checked !== shouldBeChecked) {
        checkbox.click();
      }
    },
    checked,
  );
}

async function saveFieldInventory(page, filePath) {
  const fields = await page.evaluate(() => {
    const normalize = (value) => value?.replace(/\s+/g, " ").trim() ?? "";

    // Scan the whole document (not only form descendants) — CEAC sometimes
    // nests controls outside the expected form subtree after UpdatePanels.
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
        value: element.value,
        checked:
          element.type === "radio" || element.type === "checkbox"
            ? element.checked
            : undefined,
      }));
  });

  await mkdir(workspacePath("data"), { recursive: true, mode: 0o700 });
  await writeFile(
    filePath,
    `${JSON.stringify(
      {
        pageTitle: await page.title(),
        url: page.url(),
        savedAt: new Date().toISOString(),
        fields,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(filePath, 0o600);
}

async function fillPersonalInformationOne(page) {
  const data = JSON.parse(
    await readFile(PERSONAL_INFO_1_TEST_DATA_FILE(), "utf8"),
  );

  await fillTextByPartialId(page, "tbxAPP_SURNAME", data.surname);
  await fillTextByPartialId(page, "tbxAPP_GIVEN_NAME", data.givenNames);
  await setCheckboxByPartialId(
    page,
    "cbexAPP_FULL_NAME_NATIVE_NA",
    data.fullNameNativeAlphabetDoesNotApply,
  );
  await chooseRadioByPartialId(page, "rblOtherNames", data.otherNamesUsed);
  await chooseRadioByPartialId(
    page,
    "rblTelecodeQuestion",
    data.telecodeNameUsed,
  );
  await selectByPartialId(page, "ddlAPP_GENDER", data.sex);
  await selectByPartialId(page, "ddlAPP_MARITAL_STATUS", data.maritalStatus);
  await selectByPartialId(page, "ddlDOBDay", data.dateOfBirth.day);
  await selectByPartialId(page, "ddlDOBMonth", data.dateOfBirth.month);
  await fillTextByPartialId(page, "tbxDOBYear", data.dateOfBirth.year);
  await fillTextByPartialId(page, "tbxAPP_POB_CITY", data.cityOfBirth);
  await setCheckboxByPartialId(
    page,
    "cbexAPP_POB_ST_PROVINCE_NA",
    data.stateProvinceOfBirthDoesNotApply,
  );
  await fillTextByPartialId(
    page,
    "tbxAPP_POB_ST_PROVINCE",
    data.stateProvinceOfBirth,
  );
  await selectByPartialId(page, "ddlAPP_POB_CNTRY", data.countryRegionOfBirth);
}

async function getPageValidationErrors(page) {
  return page.evaluate(() => {
    const normalize = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
    const messages = [];
    const seen = new Set();

    const looksLikeValidationMessage = (message) => {
      if (!message || message.length < 8 || message.length > 240) {
        return false;
      }
      // Reject page chrome / language dropdown dumps
      if (
        /Select Tooltip Language|Contact Us Help|COMPLETE REVIEW/i.test(message)
      ) {
        return false;
      }
      return (
        /has not been (answered|completed)/i.test(message) ||
        /is invalid/i.test(message) ||
        /is required/i.test(message) ||
        /Please correct all areas in error/i.test(message) ||
        /must be completed/i.test(message) ||
        /Specify has not/i.test(message) ||
        /does not appear to be valid/i.test(message) ||
        /must be provided/i.test(message)
      );
    };

    const addMessage = (raw) => {
      const message = normalize(raw);
      if (!looksLikeValidationMessage(message) || seen.has(message)) {
        return;
      }
      seen.add(message);
      messages.push(message);
    };

    // Prefer ValidationSummary list items — CEAC's real error list
    const summaryRoots = [
      ...document.querySelectorAll(
        "[id*='ValidationSummary'], .validation-summary-errors",
      ),
    ];
    for (const root of summaryRoots) {
      const items = [...root.querySelectorAll("li")];
      if (items.length > 0) {
        for (const item of items) {
          addMessage(item.textContent);
        }
      } else {
        addMessage(root.textContent);
      }
    }

    // ASP.NET validator spans (often more specific than the summary banner)
    for (const span of document.querySelectorAll(
      "span[id*='Error'], span.error, span[style*='color:Red'], span[style*='color: red'], span[style*='color:#']",
    )) {
      if (span.offsetParent === null && span.style?.display === "none") {
        continue;
      }
      const style = window.getComputedStyle(span);
      if (style.display === "none" || style.visibility === "hidden") {
        continue;
      }
      addMessage(span.textContent);
    }

    // Fallback: short body lines that look like field validation errors
    if (messages.length === 0) {
      const lines = (document.body?.innerText ?? "")
        .split("\n")
        .map((line) => normalize(line))
        .filter(Boolean);

      for (const line of lines) {
        addMessage(line);
        if (
          /Please correct all areas in error/i.test(line) === false &&
          messages.length >= 12
        ) {
          break;
        }
      }
    }

    return messages;
  });
}

async function logPageValidationErrors(page, context = "Page") {
  const errors = await getPageValidationErrors(page);
  if (errors.length === 0) {
    return [];
  }

  console.error(`\n${context} validation errors:`);
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  console.error("");
  return errors;
}

async function applyFieldCorrections(page, corrections) {
  for (const correction of corrections) {
    const target = correction.target;
    const value = correction.value;
    const kind = correction.kind || "text";
    log(`Applying correction: ${target} = ${value} (${kind})`);
    if (correction.partialId || kind === "select") {
      if (kind === "select" || correction.partialId) {
        await selectByPartialId(page, target, value);
        continue;
      }
    }
    if (kind === "radio") {
      await chooseRadioByPartialId(page, target, value);
      continue;
    }
    if (kind === "checkbox") {
      await setCheckboxByPartialId(
        page,
        target,
        value === true || value === "true" || value === "YES",
      );
      continue;
    }
    // Prefer full id/name when provided; fall back to partial text fill
    try {
      await fillControlByIdOrName(
        page,
        target,
        value,
        kind === "select" ? "select" : "text",
      );
    } catch {
      await fillTextByPartialId(page, target, value);
    }
  }
}

async function clickNext(page) {
  return timed("clickNext", async () => {
    // Prior select/radio postback may still be painting the page
    await page
      .waitForFunction(
        () => {
          const buttons = [
            ...document.querySelectorAll('input[type="submit"], button'),
          ];
          return buttons.some(
            (btn) =>
              btn.id.includes("btnNextPageComplete") ||
              btn.value?.includes("Next") ||
              btn.textContent?.includes("Next"),
          );
        },
        { timeout: 20_000 },
      )
      .catch(() => null);

    const previousUrl = page.url();
    log(`  from ${previousUrl}`);

    const navStart = Date.now();
    const navigationPromise = page
      .waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      })
      .catch((error) => {
        // Orphaned/racy navigations from earlier postbacks
        if (
          /detached|LifecycleWatcher|context was destroyed/i.test(error.message)
        ) {
          log(`  navigation watcher: ${error.message}`);
          return null;
        }
        throw error;
      });

    const clicked = await page.evaluate(() => {
      const buttons = [
        ...document.querySelectorAll('input[type="submit"], button'),
      ];
      const nextButton = buttons.find(
        (btn) =>
          btn.id.includes("btnNextPageComplete") ||
          btn.value?.includes("Next") ||
          btn.textContent?.includes("Next"),
      );
      if (nextButton) {
        nextButton.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => nextButton.click(), 200);
        return nextButton.value || nextButton.id || "Next";
      }
      return null;
    });

    if (!clicked) {
      await logPageState(page, "clickNext missing button");
      throw new Error('Could not find a "Next" button on the page.');
    }
    log(`  clicked "${clicked}" (deferred 200ms)`);

    const navResult = await navigationPromise;
    if (!navResult) {
      // Watcher lost a race — wait until URL/node changes or Next target loads
      await page
        .waitForFunction(
          (prev) => location.href !== prev,
          { timeout: 30_000 },
          previousUrl,
        )
        .catch(() => null);
    }
    log(`  navigation done in ${formatMs(Date.now() - navStart)}`);

    // Give ASP.NET validation UI a moment to render on postback
    await sleep(200, "validation UI settle after Next");

    await logPageState(page, "after Next");
    let errors = await logPageValidationErrors(page, "After clicking Next");
    let correctionAttempts = 0;
    while (errors.length > 0 && correctionAttempts < 5) {
      correctionAttempts += 1;
      log(
        `Validation errors — invoking onValidationError (attempt ${correctionAttempts})`,
      );
      if (jobContext.hooks.onStatus) {
        await jobContext.hooks.onStatus("awaiting_correction");
      }
      const corrections = await jobContext.hooks.onValidationError(
        errors.map((message) => ({ message })),
      );
      if (!corrections?.length) {
        throw new Error(
          `CEAC validation failed on ${page.url()} (was ${previousUrl}):\n${errors
            .map((message) => `  - ${message}`)
            .join("\n")}`,
        );
      }
      await applyFieldCorrections(page, corrections);
      if (jobContext.hooks.onStatus) {
        await jobContext.hooks.onStatus("filling");
      }
      // Retry Next after corrections
      const retryPreviousUrl = page.url();
      const retryNav = page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 })
        .catch(() => null);
      const retryClicked = await page.evaluate(() => {
        const buttons = [
          ...document.querySelectorAll('input[type="submit"], button'),
        ];
        const nextButton = buttons.find(
          (btn) =>
            btn.id.includes("btnNextPageComplete") ||
            btn.value?.includes("Next") ||
            btn.textContent?.includes("Next"),
        );
        if (nextButton) {
          nextButton.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => nextButton.click(), 200);
          return true;
        }
        return false;
      });
      if (!retryClicked) {
        throw new Error(
          'Could not find a "Next" button after applying corrections.',
        );
      }
      await retryNav;
      await sleep(200, "validation UI settle after correction retry");
      await logPageState(page, "after correction retry Next");
      errors = await logPageValidationErrors(page, "After correction retry");
      if (errors.length === 0) {
        log(`Corrections accepted after attempt ${correctionAttempts}`);
        return;
      }
    }
    if (errors.length > 0) {
      throw new Error(
        `CEAC validation failed on ${page.url()} (was ${previousUrl}) after ${correctionAttempts} correction attempt(s):\n${errors
          .map((message) => `  - ${message}`)
          .join("\n")}`,
      );
    }
  });
}

async function fillPersonalInformationTwo(page) {
  const data = JSON.parse(
    await readFile(PERSONAL_INFO_2_TEST_DATA_FILE(), "utf8"),
  );

  await selectByPartialId(page, "ddlAPP_NATL", data.nationality);
  await chooseRadioByPartialId(
    page,
    "rblAPP_OTH_NATL_IND",
    data.hasOtherNationality,
  );

  await chooseRadioByPartialId(
    page,
    "rblPermResOtherCntryInd",
    data.isPermanentResidentOfOtherCountry,
  );

  if (data.nationalIdentificationNumberDoesNotApply) {
    await setCheckboxByPartialId(page, "cbexAPP_NATIONAL_ID_NA", true);
  } else if (data.nationalIdentificationNumber) {
    await fillTextByPartialId(
      page,
      "tbxAPP_NATIONAL_ID",
      data.nationalIdentificationNumber,
    );
  }

  // For SSN and Taxpayer ID, force "Does Not Apply" (do not toggle-click)
  if (data.hasSSN === "NO") {
    await setCheckboxByPartialId(page, "cbexAPP_SSN_NA", true);
  }

  if (data.hasTaxpayerID === "NO") {
    await setCheckboxByPartialId(page, "cbexAPP_TAX_ID_NA", true);
  }
}

async function selectWithPostback(page, partialId, value) {
  return timed(`select postback ${partialId}=${value}`, async () => {
    const selector = await requireSelector(page, partialId);
    const changed = await page.$eval(
      selector,
      (select, requestedValue) => {
        const normalize = (candidate) =>
          candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
        const requested = normalize(requestedValue);
        const option = [...select.options].find(
          (candidate) =>
            normalize(candidate.value) === requested ||
            normalize(candidate.textContent) === requested,
        );
        if (!option) {
          throw new Error(`Option not found: ${requestedValue}`);
        }
        if (select.value === option.value) {
          return false;
        }
        select.value = option.value;
        return true;
      },
      value,
    );

    if (!changed) {
      log(`  ${partialId} already ${value} — skip settle`);
      return;
    }

    await page.$eval(selector, (select) => {
      setTimeout(() => {
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }, 0);
    });

    // Selects often full-navigate (occupation, purpose); never early-exit.
    await settleAfterPossiblePostback(page, partialId, {
      allowEarlyExit: false,
      timeoutMs: selectPostbackTimeoutMs,
    });
  });
}

async function waitForPartialId(page, partialId, timeout = 15_000) {
  await page.waitForFunction(
    (partial) =>
      [...document.querySelectorAll("input, select, textarea")].some(
        (element) =>
          element.id.includes(partial) || element.name.includes(partial),
      ),
    { timeout },
    partialId,
  );
}

async function findControlIdByLabel(page, labelSnippet) {
  return page.evaluate((snippet) => {
    const normalize = (value) =>
      value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
    const target = normalize(snippet);

    const isFillable = (element) =>
      element &&
      !["hidden", "image", "submit", "button", "radio", "checkbox"].includes(
        (element.type || "").toLowerCase(),
      );

    for (const label of document.querySelectorAll("label")) {
      if (!normalize(label.textContent).includes(target)) {
        continue;
      }
      const forId = label.getAttribute("for");
      if (forId && isFillable(document.getElementById(forId))) {
        return forId;
      }
    }

    for (const cell of document.querySelectorAll("td, th, li, div, span")) {
      const text = normalize(cell.textContent);
      // Prefer tight label nodes so we don't match huge containers
      if (!text.includes(target) || text.length > 100) {
        continue;
      }

      const row = cell.closest("tr") || cell.parentElement;
      if (!row) {
        continue;
      }

      const candidates = [
        ...row.querySelectorAll("input, select, textarea"),
        ...(row.nextElementSibling?.querySelectorAll(
          "input, select, textarea",
        ) ?? []),
      ].filter(isFillable);

      if (candidates[0]?.id) {
        return candidates[0].id;
      }
      if (candidates[0]?.name) {
        return { name: candidates[0].name };
      }
    }

    return null;
  }, labelSnippet);
}

async function fillControlByIdOrName(page, target, value, kind) {
  await page.evaluate(
    (controlTarget, fieldValue, fieldKind) => {
      const normalize = (candidate) =>
        candidate?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";

      let element = null;
      if (typeof controlTarget === "string") {
        element = document.getElementById(controlTarget);
      } else if (controlTarget?.name) {
        element = document.querySelector(
          `[name="${CSS.escape(controlTarget.name)}"]`,
        );
      }

      if (!element) {
        throw new Error(`Missing control ${JSON.stringify(controlTarget)}`);
      }

      if (fieldKind === "select") {
        const requested = normalize(String(fieldValue));
        const option = [...element.options].find((candidate) => {
          const optionValue = normalize(candidate.value);
          const label = normalize(candidate.textContent);
          return (
            optionValue === requested ||
            label === requested ||
            label.startsWith(requested) ||
            optionValue.padStart(2, "0") === requested.padStart(2, "0")
          );
        });
        if (!option) {
          throw new Error(
            `Value "${fieldValue}" not available for ${element.id || element.name}`,
          );
        }
        element.value = option.value;
      } else {
        element.value = String(fieldValue);
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));
    },
    target,
    value,
    kind,
  );
}

async function resolveUsStayAddressControls(page) {
  const byIdPattern = await page.evaluate(() => {
    const controls = [...document.querySelectorAll("input, select, textarea")];
    const byId = (re) =>
      controls.find((element) => re.test(element.id || element.name))?.id ||
      null;
    return {
      street:
        byId(/StreetAddress1|STREET_ADDR_?1|StreetAddr1|Street_Addr/i) ||
        byId(/StreetAddress(?!2)/i),
      city: byId(/tbxCity|tbxCITY|US_CITY|TravelCity/i),
      state: byId(/TravelState|ddlSTATE|US_STATE|State_CD/i),
      zip: byId(/ZIPCode|ZipCode|ZIP_CODE|POSTAL/i),
    };
  });

  if (byIdPattern.street && byIdPattern.city && byIdPattern.state) {
    return byIdPattern;
  }

  // CEAC labels the stay address section explicitly
  const street =
    byIdPattern.street ||
    (await findControlIdByLabel(page, "Street Address (Line 1)"));
  const city = byIdPattern.city || (await findControlIdByLabel(page, "City"));
  const state =
    byIdPattern.state || (await findControlIdByLabel(page, "State"));
  const zip = byIdPattern.zip || (await findControlIdByLabel(page, "ZIP Code"));

  return { street, city, state, zip };
}

async function fillTravelInformation(page) {
  const data = JSON.parse(await readFile(TRAVEL_INFO_TEST_DATA_FILE(), "utf8"));

  // Purpose of Trip triggers an ASP.NET postback and reveals "Specify"
  await selectWithPostback(page, "ddlPurposeOfTrip", data.purposeOfTrip);
  await waitForPartialId(page, "ddlOtherPurpose");
  await selectWithPostback(page, "ddlOtherPurpose", data.otherPurpose);

  // Specific travel Yes/No postbacks and reveals arrival / address blocks
  await chooseRadioWithPostback(
    page,
    "rblSpecificTravel",
    data.hasSpecificTravelPlans,
  );
  await waitForPartialId(page, "ddlTRAVEL_DTEMonth");

  // Wait briefly for US-stay address; only toggle Yes→No if still missing
  const addressAppeared = await page
    .waitForFunction(
      () => {
        const controls = [
          ...document.querySelectorAll("input, select, textarea"),
        ];
        const hasControl = controls.some((element) =>
          /StreetAddress|STREET_ADDR|Addr_Ln1|Address1/i.test(
            `${element.id} ${element.name}`,
          ),
        );
        const hasHeading = /Address Where You Will Stay in the U\.S/i.test(
          document.body?.innerText ?? "",
        );
        return hasControl || hasHeading;
      },
      { timeout: 3_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!addressAppeared && data.hasSpecificTravelPlans === "NO") {
    log(
      "US stay address block missing after No; toggling travel plans to refresh the form...",
    );
    await chooseRadioWithPostback(page, "rblSpecificTravel", "YES");
    await chooseRadioWithPostback(page, "rblSpecificTravel", "NO");
    await waitForPartialId(page, "ddlTRAVEL_DTEMonth");
  }

  // Intended Date of Arrival: ddlTRAVEL_DTEDay / ddlTRAVEL_DTEMonth / tbxTRAVEL_DTEYear
  if (data.arrivalDate) {
    if (data.arrivalDate.day) {
      await selectByPartialId(page, "ddlTRAVEL_DTEDay", data.arrivalDate.day);
    }
    await selectByPartialId(page, "ddlTRAVEL_DTEMonth", data.arrivalDate.month);
    await fillTextByPartialId(page, "tbxTRAVEL_DTEYear", data.arrivalDate.year);
  }

  // Intended Length of Stay: tbxTRAVEL_LOS + ddlTRAVEL_LOS_CD (D/W/M/Y)
  if (data.lengthOfStay) {
    await fillTextByPartialId(
      page,
      "tbxTRAVEL_LOS",
      data.lengthOfStay.duration,
    );
    await selectByPartialId(page, "ddlTRAVEL_LOS_CD", data.lengthOfStay.unit);
  }

  // Who-is-paying can trigger another UpdatePanel refresh before address is final
  await selectWithPostback(page, "ddlWhoIsPaying", data.payingForTrip);

  // Address Where You Will Stay in the U.S.
  if (data.usAddress) {
    await page
      .waitForFunction(
        () => {
          const hasStreetControl = [
            ...document.querySelectorAll("input, select, textarea"),
          ].some((element) =>
            /StreetAddress|STREET_ADDR|Street_Addr|Addr_Ln1|Address1/i.test(
              `${element.id} ${element.name}`,
            ),
          );
          const hasStreetLabel = [
            ...document.querySelectorAll("td, th, label, span"),
          ].some((element) => {
            const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
            return /Street Address \(Line 1\)/i.test(text) && text.length < 80;
          });
          return hasStreetControl || hasStreetLabel;
        },
        { timeout: 5_000 },
      )
      .catch(() => null);

    // Scroll through the form — some CEAC controls mount when brought into view
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.scrollTo(0, 0);
    });

    let addressIds = await resolveUsStayAddressControls(page);

    if (!addressIds.street || !addressIds.city || !addressIds.state) {
      // Last resort: locate the "Address Where You Will Stay" block and map
      // the first text/text/select trio inside it.
      const blockIds = await page.evaluate(() => {
        const heading = [
          ...document.querySelectorAll("td, th, span, div, b"),
        ].find((element) => {
          const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
          return (
            /Address Where You Will Stay in the U\.S/i.test(text) &&
            text.length < 80
          );
        });
        if (!heading) {
          return null;
        }

        let root = heading.closest("table") || heading.parentElement;
        for (let i = 0; i < 6 && root; i += 1) {
          const fillable = [
            ...root.querySelectorAll("input, select, textarea"),
          ].filter(
            (element) =>
              ![
                "hidden",
                "image",
                "submit",
                "button",
                "radio",
                "checkbox",
              ].includes((element.type || "").toLowerCase()) &&
              (element.id || element.name),
          );
          const texts = fillable.filter(
            (element) =>
              element.tagName === "INPUT" || element.tagName === "TEXTAREA",
          );
          const selects = fillable.filter(
            (element) => element.tagName === "SELECT",
          );
          if (texts.length >= 2 && selects.length >= 1) {
            return {
              street: texts[0].id || null,
              streetName: texts[0].name || null,
              city: texts[1].id || null,
              cityName: texts[1].name || null,
              state: selects[0].id || null,
              stateName: selects[0].name || null,
              zip: texts[2]?.id || null,
              zipName: texts[2]?.name || null,
            };
          }
          root = root.parentElement;
        }
        return null;
      });

      if (blockIds) {
        addressIds = {
          street: blockIds.street || { name: blockIds.streetName },
          city: blockIds.city || { name: blockIds.cityName },
          state: blockIds.state || { name: blockIds.stateName },
          zip:
            blockIds.zip ||
            (blockIds.zipName ? { name: blockIds.zipName } : null),
        };
      }
    }

    if (!addressIds.street || !addressIds.city || !addressIds.state) {
      await maybeSaveFieldInventory(page, TRAVEL_INFO_FIELDS_FILE());
      const debug = await page.evaluate(() => {
        const controls = [
          ...document.querySelectorAll("input, select, textarea"),
        ]
          .filter((element) => element.id || element.name)
          .map(
            (element) =>
              `${element.tagName.toLowerCase()}:${element.type || ""}:${element.id || element.name}`,
          );
        const hasStayHeading = /Address Where You Will Stay/i.test(
          document.body?.innerText ?? "",
        );
        return { controls, hasStayHeading };
      });
      throw new Error(
        `Could not find US stay address fields (street/city/state). hasStayHeading=${debug.hasStayHeading}. Controls:\n  - ${debug.controls.join("\n  - ")}`,
      );
    }

    await fillControlByIdOrName(
      page,
      addressIds.street,
      data.usAddress.street,
      "text",
    );
    await fillControlByIdOrName(
      page,
      addressIds.city,
      data.usAddress.city,
      "text",
    );
    await fillControlByIdOrName(
      page,
      addressIds.state,
      data.usAddress.state,
      "select",
    );
    if (data.usAddress.zipCode && addressIds.zip) {
      await fillControlByIdOrName(
        page,
        addressIds.zip,
        data.usAddress.zipCode,
        "text",
      );
    }
  }

  await maybeSaveFieldInventory(page, TRAVEL_INFO_FIELDS_FILE());
  console.log(`Travel field inventory saved to ${TRAVEL_INFO_FIELDS_FILE()}`);
}

async function fillTravelCompanions(page) {
  const data = JSON.parse(
    await readFile(TRAVEL_COMPANIONS_TEST_DATA_FILE(), "utf8"),
  );

  await maybeSaveFieldInventory(page, TRAVEL_COMPANIONS_FIELDS_FILE());

  // Optional: probe YES/group branches (several postbacks). Skip by default.
  if (probeConditionals) {
    console.log("Probing Travel Companions conditionals (DS160_PROBE=true)...");
    await chooseRadioWithPostback(
      page,
      "rblOtherPersonsTravelingWithYou",
      "YES",
    );
    await maybeSaveFieldInventory(page, TRAVEL_COMPANIONS_YES_FIELDS_FILE());

    if (await pageHasPartialId(page, "rblGroupTravel")) {
      await chooseRadioWithPostback(page, "rblGroupTravel", "YES");
      await maybeSaveFieldInventory(
        page,
        TRAVEL_COMPANIONS_GROUP_YES_FIELDS_FILE(),
      );

      await chooseRadioWithPostback(page, "rblGroupTravel", "NO");
      await maybeSaveFieldInventory(
        page,
        TRAVEL_COMPANIONS_GROUP_NO_FIELDS_FILE(),
      );
    }
  }

  // Apply test answers
  if (data.otherPersonsTravelingWithYou === "YES") {
    await chooseRadioWithPostback(
      page,
      "rblOtherPersonsTravelingWithYou",
      "YES",
    );
    const asGroup = data.travelingAsGroup ?? "NO";
    await chooseRadioWithPostback(page, "rblGroupTravel", asGroup);

    if (asGroup === "YES") {
      const groupNamePartial = (await pageHasPartialId(page, "tbxGroupName"))
        ? "tbxGroupName"
        : (await pageHasPartialId(page, "tbxGROUP_NAME"))
          ? "tbxGROUP_NAME"
          : null;
      if (!groupNamePartial) {
        throw new Error("Could not find group name text field.");
      }
      await fillTextByPartialId(page, groupNamePartial, data.groupName);
    } else {
      const companion = data.companions?.[0];
      if (!companion) {
        throw new Error("Companion details required when group=NO.");
      }

      const surnamePartial = (await pageHasPartialId(page, "tbxSurname"))
        ? "tbxSurname"
        : "tbxSURNAME";
      const givenPartial = (await pageHasPartialId(page, "tbxGivenName"))
        ? "tbxGivenName"
        : "tbxGIVEN_NAME";
      const relationshipPartial = (await pageHasPartialId(
        page,
        "ddlTOP_RELATIONSHIP",
      ))
        ? "ddlTOP_RELATIONSHIP"
        : (await pageHasPartialId(page, "ddlRelationship"))
          ? "ddlRelationship"
          : "ddlRelate";

      await fillTextByPartialId(page, surnamePartial, companion.surname);
      await fillTextByPartialId(page, givenPartial, companion.givenNames);
      await selectByPartialId(
        page,
        relationshipPartial,
        companion.relationship,
      );
    }
  } else {
    await chooseRadioWithPostback(
      page,
      "rblOtherPersonsTravelingWithYou",
      "NO",
    );
  }

  await maybeSaveFieldInventory(page, TRAVEL_COMPANIONS_FIELDS_FILE());
  console.log(
    `Travel Companions filled (${data.otherPersonsTravelingWithYou})`,
  );
}

async function loadSession() {
  try {
    return JSON.parse(await readFile(SESSION_FILE(), "utf8"));
  } catch {
    return null;
  }
}

async function retrieveExistingApplication(page, session) {
  const personal = JSON.parse(
    await readFile(PERSONAL_INFO_1_TEST_DATA_FILE(), "utf8"),
  );
  const surname = (personal.surname || "TEST").slice(0, 5).toUpperCase();
  const birthYear = personal.dateOfBirth?.year || "1990";
  const applicationId = (
    process.env.DS160_APPLICATION_ID ||
    session?.applicationId ||
    ""
  )
    .trim()
    .toUpperCase();

  if (!applicationId) {
    throw new Error(
      "DS160_RESUME is set but no Application ID was found. Set DS160_APPLICATION_ID or create data/session.json.",
    );
  }

  console.log(`Retrieving application ${applicationId}...`);

  const retrieveSelector = (await page.$(retrieveApplicationSelector))
    ? retrieveApplicationSelector
    : await page.evaluate(() => {
        const normalize = (value) =>
          value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
        const target = [
          ...document.querySelectorAll("a, input[type='submit'], button"),
        ].find((candidate) =>
          normalize(candidate.textContent || candidate.value).includes(
            "RETRIEVE",
          ),
        );
        if (!target) return null;
        if (!target.id) target.id = "ds160-retrieve-link";
        return `#${CSS.escape(target.id)}`;
      });

  if (!retrieveSelector) {
    throw new Error('Could not find "Retrieve an Application" control.');
  }

  await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    }),
    page.click(retrieveSelector),
  ]);

  // Application ID
  const appIdSelector = await page.evaluate(() => {
    const candidates = [
      ...document.querySelectorAll('input[type="text"], input:not([type])'),
    ];
    const target =
      candidates.find((element) =>
        /appid|application/i.test(`${element.id} ${element.name}`),
      ) || candidates[0];
    if (!target) return null;
    if (!target.id) target.id = "ds160-retrieve-appid";
    return `#${CSS.escape(target.id)}`;
  });
  if (!appIdSelector) {
    throw new Error("Could not find Application ID input on retrieve page.");
  }
  await page.click(appIdSelector, { clickCount: 3 });
  await page.type(appIdSelector, applicationId);

  // First retrieve click may reveal surname / YOB / security answer
  const clickRetrieve = async () => {
    const selector = await page.evaluate(() => {
      const normalize = (value) =>
        value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const candidates = [
        ...document.querySelectorAll(
          'input[type="submit"], input[type="button"], button, a',
        ),
      ];
      const target = candidates.find((candidate) =>
        normalize(candidate.value || candidate.textContent).includes(
          "RETRIEVE",
        ),
      );
      if (!target) return null;
      if (!target.id) target.id = "ds160-retrieve-submit";
      return `#${CSS.escape(target.id)}`;
    });
    if (!selector) {
      throw new Error('Could not find "Retrieve Application" control.');
    }
    await Promise.all([
      page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        })
        .catch(() => null),
      page.click(selector),
    ]);
    await sleep(500, "settle after Retrieve Application click");
  };

  await clickRetrieve();

  // Fill surname / year / security answer if present
  await page.evaluate(
    (surnameValue, yearValue, answerValue) => {
      const normalize = (value) =>
        value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
      const inputs = [
        ...document.querySelectorAll('input[type="text"], input:not([type])'),
      ];

      const fillByHint = (hints, value) => {
        const target = inputs.find((element) => {
          const haystack = normalize(
            `${element.id} ${element.name} ${[...(element.labels || [])]
              .map((label) => label.textContent)
              .join(" ")}`,
          );
          return hints.some((hint) => haystack.includes(hint));
        });
        if (target) {
          target.value = value;
          target.dispatchEvent(new Event("input", { bubbles: true }));
          target.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return Boolean(target);
      };

      fillByHint(["SURNAME", "LAST NAME"], surnameValue);
      fillByHint(["YEAR", "BIRTH", "DOB"], yearValue);
      fillByHint(["ANSWER", "SECURITY"], answerValue);
    },
    surname,
    birthYear,
    securityAnswer(),
  );

  // Some CEAC flows need a second retrieve submit after identity fields
  if (
    await page.evaluate(() =>
      /security|surname|year of birth|retrieve application/i.test(
        document.body?.innerText ?? "",
      ),
    )
  ) {
    await clickRetrieve();
  }

  console.log(`Retrieved application opened: ${page.url()}`);
}

async function getPageNode(page) {
  const url = page.url();
  const node = new URL(url).searchParams.get("node");
  const title = await page.title();
  return { url, node, title };
}

async function readControlValue(page, partialId) {
  const selector = await selectorForPartialId(page, partialId);
  if (!selector) {
    return null;
  }
  return page.$eval(selector, (element) => {
    if (element.type === "checkbox" || element.type === "radio") {
      return element.checked ? element.value || "checked" : "";
    }
    return element.value ?? "";
  });
}

async function fillAddressAndPhone(page) {
  const defaults = {
    street: "123 TEST STREET",
    city: "HYDERABAD",
    state: "TELANGANA",
    postalCode: "500001",
    country: "IND",
    mailingSameAsHome: "YES",
    primaryPhone: "9876543210",
    workPhoneDoesNotApply: true,
    secondaryPhoneDoesNotApply: true,
    email: "test.applicant@example.com",
    additionalPhone: "NO",
    additionalEmail: "NO",
    socialMedia: "NO",
  };
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(ADDRESS_PHONE_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      ADDRESS_PHONE_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, ADDRESS_PHONE_FIELDS_FILE());

  // Radios first — CEAC postbacks clear text filled earlier
  if (await pageHasPartialId(page, "rblMailingAddrSame")) {
    await chooseRadioWithPostback(
      page,
      "rblMailingAddrSame",
      data.mailingSameAsHome,
    );
  }
  for (const [partial, value] of [
    ["rblAddPhone", data.additionalPhone],
    ["rblAddEmail", data.additionalEmail],
    ["rblAddSocial", data.socialMedia],
  ]) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    }
  }

  // Fill home address + contact after all postbacks settle
  const fillHomeAndPhones = async () => {
    await fillTextByPartialId(page, "tbxAPP_ADDR_LN1", data.street);
    await fillTextByPartialId(page, "tbxAPP_ADDR_CITY", data.city);
    await setCheckboxByPartialId(page, "cbexAPP_ADDR_STATE_NA", false);
    await fillTextByPartialId(page, "tbxAPP_ADDR_STATE", data.state);
    await setCheckboxByPartialId(page, "cbexAPP_ADDR_POSTAL_CD_NA", false);
    await fillTextByPartialId(page, "tbxAPP_ADDR_POSTAL_CD", data.postalCode);
    await selectByPartialId(page, "ddlCountry", data.country);

    await fillTextByPartialId(page, "tbxAPP_HOME_TEL", data.primaryPhone);

    if (data.workPhoneDoesNotApply) {
      await setCheckboxByPartialId(page, "cbexAPP_BUS_TEL_NA", true);
    } else if (data.workPhone) {
      await setCheckboxByPartialId(page, "cbexAPP_BUS_TEL_NA", false);
      await fillTextByPartialId(page, "tbxAPP_BUS_TEL", data.workPhone);
    }

    if (data.secondaryPhoneDoesNotApply) {
      await setCheckboxByPartialId(page, "cbexAPP_MOBILE_TEL_NA", true);
    } else if (data.secondaryPhone) {
      await setCheckboxByPartialId(page, "cbexAPP_MOBILE_TEL_NA", false);
      await fillTextByPartialId(page, "tbxAPP_MOBILE_TEL", data.secondaryPhone);
    }

    await fillTextByPartialId(page, "tbxAPP_EMAIL_ADDR", data.email);

    // Platform dropdown defaults to "- Select One -" (SONE); must choose NONE
    if (await pageHasPartialId(page, "ddlSocialMedia")) {
      await selectByPartialId(
        page,
        "ddlSocialMedia",
        data.socialMediaPlatform || "NONE",
      );
    }
  };

  await fillHomeAndPhones();

  // Verify critical values survived; CEAC sometimes drops them after late postbacks
  const expected = [
    ["tbxAPP_ADDR_LN1", data.street],
    ["tbxAPP_ADDR_CITY", data.city],
    ["tbxAPP_ADDR_STATE", data.state],
    ["tbxAPP_ADDR_POSTAL_CD", data.postalCode],
    ["tbxAPP_HOME_TEL", data.primaryPhone],
    ["tbxAPP_EMAIL_ADDR", data.email],
  ];
  let missing = [];
  for (const [partial, value] of expected) {
    const actual = await readControlValue(page, partial);
    if (
      (actual || "").trim().toUpperCase() !== String(value).trim().toUpperCase()
    ) {
      missing.push(`${partial} (got "${actual}")`);
    }
  }
  const country = await readControlValue(page, "ddlCountry");
  if (!country || country === "") {
    missing.push(`ddlCountry (got "${country}")`);
  }
  if (missing.length > 0) {
    console.log(
      `Address/Phone values missing after first fill, retrying: ${missing.join(", ")}`,
    );
    await fillHomeAndPhones();
  }

  await maybeSaveFieldInventory(page, ADDRESS_PHONE_FIELDS_FILE());
  const finalCheck = [];
  for (const [partial, value] of expected) {
    const actual = await readControlValue(page, partial);
    finalCheck.push(`${partial}=${actual || ""}`);
    if (
      (actual || "").trim().toUpperCase() !== String(value).trim().toUpperCase()
    ) {
      throw new Error(
        `Address/Phone field ${partial} did not stick (expected "${value}", got "${actual}")`,
      );
    }
  }
  console.log(`Address and Phone filled: ${finalCheck.join(", ")}`);
}

async function findFirstPartialId(page, partials) {
  for (const partial of partials) {
    if (await pageHasPartialId(page, partial)) {
      return partial;
    }
  }
  return null;
}

async function isConfirmationPage(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    const node = new URL(location.href).searchParams.get("node") || "";
    const title = document.title || "";
    const hasBarcodeImage = Boolean(
      document.querySelector(
        'img[id*="Barcode" i], img[src*="Barcode" i], img[alt*="barcode" i]',
      ),
    );
    const hasPrint =
      [...document.querySelectorAll("a, input, button")].some((element) =>
        /print confirmation|email confirmation|view confirmation/i.test(
          `${element.value || ""} ${element.textContent || ""} ${element.id}`,
        ),
      ) || /Print Confirmation|Email Confirmation/i.test(text);
    return (
      /Confirm/i.test(node) ||
      /Confirmation/i.test(title) ||
      hasBarcodeImage ||
      hasPrint ||
      /has been submitted|thank you for submitting|confirmation page/i.test(
        text,
      )
    );
  });
}

async function clickControlByText(page, pattern) {
  const navigationPromise = page
    .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => null);

  const clicked = await page.evaluate((source) => {
    const re = new RegExp(source, "i");
    const candidates = [
      ...document.querySelectorAll(
        'input[type="submit"], input[type="button"], button, a',
      ),
    ];
    const target = candidates.find((candidate) =>
      re.test(
        `${candidate.value || ""} ${candidate.textContent || ""} ${candidate.id}`,
      ),
    );
    if (!target) {
      return null;
    }
    target.scrollIntoView({ block: "center" });
    setTimeout(() => target.click(), 150);
    return target.value || target.textContent || target.id;
  }, pattern.source || pattern);

  if (!clicked) {
    return null;
  }
  await navigationPromise;
  await sleep(600, `settle after clickControlMatching(${pattern})`);
  return clicked;
}

async function extractConfirmationDetails(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    const barcodeImg = document.querySelector(
      'img[id*="Barcode" i], img[src*="Barcode" i], img[alt*="barcode" i]',
    );
    const applicationId =
      text.match(/APPLICATION\s+ID\s*:?\s*(AA[A-Z0-9]{8,})/i)?.[1] ??
      text.match(/\b(AA[A-Z0-9]{8,})\b/i)?.[1] ??
      null;
    return {
      url: location.href,
      title: document.title,
      node: new URL(location.href).searchParams.get("node"),
      applicationId: applicationId ? applicationId.toUpperCase() : null,
      hasBarcode: Boolean(barcodeImg),
      barcodeImageSrc: barcodeImg?.src ?? null,
      printAvailable: [...document.querySelectorAll("a, input, button")].some(
        (element) =>
          /print confirmation/i.test(
            `${element.value || ""} ${element.textContent || ""}`,
          ),
      ),
      emailAvailable: [...document.querySelectorAll("a, input, button")].some(
        (element) =>
          /email confirmation/i.test(
            `${element.value || ""} ${element.textContent || ""}`,
          ),
      ),
      familyGroupAvailable: /family or group application|create a family/i.test(
        text,
      ),
      snippet: text.slice(0, 2500),
    };
  });
}

async function handleConfirmationPage(page) {
  await maybeSaveFieldInventory(page, CONFIRMATION_FIELDS_FILE(), true);

  const details = await extractConfirmationDetails(page);
  await mkdir(workspacePath("data"), { recursive: true, mode: 0o700 });

  const pdfPath = workspacePath("data/ds160-confirmation.pdf");
  const pngPath = workspacePath("data/ds160-confirmation.png");
  jobContext.lastPdfPath = pdfPath;

  try {
    await page.pdf({
      path: pdfPath,
      format: "Letter",
      printBackground: true,
      margin: { top: "0.4in", bottom: "0.4in", left: "0.4in", right: "0.4in" },
    });
    await chmod(pdfPath, 0o600);
    details.pdfPath = pdfPath;
    console.log(`Confirmation PDF saved to ${pdfPath}`);
  } catch (error) {
    console.log(`Could not save confirmation PDF: ${error.message}`);
  }

  try {
    await page.screenshot({ path: pngPath, fullPage: true });
    await chmod(pngPath, 0o600);
    details.screenshotPath = pngPath;
    console.log(`Confirmation screenshot saved to ${pngPath}`);
  } catch (error) {
    console.log(`Could not save confirmation screenshot: ${error.message}`);
  }

  const payload = {
    ...details,
    savedAt: new Date().toISOString(),
  };
  jobContext.lastConfirmation = payload;
  await writeFile(
    workspacePath("data/confirmation.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    { mode: 0o600 },
  );
  await chmod(workspacePath("data/confirmation.json"), 0o600);

  if (payload.applicationId) {
    await saveApplicationId(payload.applicationId);
  }

  console.log(
    `Confirmation captured (applicationId=${payload.applicationId || "unknown"}).`,
  );
  console.log(`Details: data/confirmation.json`);
  console.log("Artifacts saved — automation will exit and close the browser.");
  return payload;
}

async function goToConfirmationFromSignPage(page) {
  // After a successful e-sign, CEAC sometimes leaves SignCertify with
  // "Next: Confirmation" instead of jumping straight to the barcode page.
  const clicked = await clickControlByText(
    page,
    /next:\s*confirmation|confirmation/i,
  );
  if (!clicked) {
    // Fall back to the standard Next control
    await clickNext(page);
    return "Next";
  }
  return clicked;
}

async function clickSignAndSubmit(page) {
  const previousUrl = page.url();
  const navigationPromise = page.waitForNavigation({
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const clicked = await page.evaluate(() => {
    const button =
      document.querySelector('[id$="btnSignApp"]') ||
      [...document.querySelectorAll('input[type="submit"], button')].find(
        (candidate) =>
          /sign and submit/i.test(
            candidate.value || candidate.textContent || "",
          ),
      );
    if (!button) {
      return false;
    }
    button.scrollIntoView({ block: "center" });
    setTimeout(() => button.click(), 200);
    return true;
  });

  if (!clicked) {
    throw new Error('Could not find "Sign and Submit Application" button.');
  }

  await navigationPromise;
  await sleep(800, "settle after Sign and Submit");

  const errors = await logPageValidationErrors(page, "After Sign and Submit");
  if (errors.length > 0) {
    throw new Error(
      `CEAC rejected Sign and Submit on ${page.url()} (was ${previousUrl}):\n${errors
        .map((message) => `  - ${message}`)
        .join("\n")}`,
    );
  }
}

async function fillSignAndSubmit(page) {
  // Already on barcode / thank-you confirmation
  if (await isConfirmationPage(page)) {
    const confirmation = await handleConfirmationPage(page);
    return { submitted: true, confirmation };
  }

  if (!allowSubmit()) {
    await maybeSaveFieldInventory(page, SIGN_SUBMIT_FIELDS_FILE(), true);
    console.log(
      "SignCertify reached. Set DS160_ALLOW_SUBMIT=true to enable Sign and Submit.",
    );
    console.log(
      "Put real applicant data in fixtures/*.test.json first (see APPLICANT_DATA.md).",
    );
    return { submitted: false };
  }

  let data = {
    assistedByPreparer: "NO",
    // Falls back to fixtures/passport.test.json passportNumber when omitted
    passportNumber: null,
  };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(SIGN_SUBMIT_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      SIGN_SUBMIT_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  if (!data.passportNumber) {
    try {
      const passport = JSON.parse(
        await readFile(PASSPORT_TEST_DATA_FILE(), "utf8"),
      );
      data.passportNumber = passport.passportNumber;
    } catch {
      // ignore
    }
  }
  if (!data.passportNumber) {
    throw new Error(
      "Sign and Submit needs passportNumber in fixtures/sign-submit.test.json or fixtures/passport.test.json",
    );
  }

  await maybeSaveFieldInventory(page, SIGN_SUBMIT_FIELDS_FILE(), true);

  const hasSignButton = await page.evaluate(() =>
    Boolean(
      document.querySelector('[id$="btnSignApp"]') ||
      [...document.querySelectorAll('input[type="submit"], button')].some(
        (candidate) =>
          /sign and submit/i.test(
            candidate.value || candidate.textContent || "",
          ),
      ),
    ),
  );

  // Sign button already consumed — advance with Next: Confirmation
  if (!hasSignButton) {
    console.log("No Sign button on page; clicking through to Confirmation...");
    await goToConfirmationFromSignPage(page);
    if (!(await isConfirmationPage(page))) {
      throw new Error(
        `Expected confirmation page after Next: Confirmation, landed on ${page.url()}`,
      );
    }
    const confirmation = await handleConfirmationPage(page);
    return { submitted: true, confirmation };
  }

  if (await pageHasPartialId(page, "rblPREP_IND")) {
    await chooseRadioWithPostback(page, "rblPREP_IND", data.assistedByPreparer);
    if (data.assistedByPreparer === "YES" && data.preparer) {
      for (const [partial, value] of Object.entries(
        data.preparer.texts || {},
      )) {
        if (value && (await pageHasPartialId(page, partial))) {
          await fillTextByPartialId(page, partial, value);
        }
      }
    }
  }

  await fillTextByPartialId(page, "PPTNumTbx", data.passportNumber);

  console.log(
    "Sign page CAPTCHA required. Image will be saved; enter the code via data/captcha.txt.",
  );
  const captcha = await promptForCaptcha(page);
  await fillTextByPartialId(page, "CodeTextBox", captcha);

  await clickSignAndSubmit(page);

  // CEAC may land on confirmation directly, or leave SignCertify with Next: Confirmation
  if (!(await isConfirmationPage(page))) {
    const stillReady = await page.evaluate(() =>
      /ready to be submitted|Next:\s*Confirmation/i.test(
        document.body?.innerText ?? "",
      ),
    );
    if (stillReady || /SignCertify/i.test(page.url())) {
      console.log(
        "Post-sign page still on SignCertify — opening Confirmation...",
      );
      await goToConfirmationFromSignPage(page);
    }
  }

  if (!(await isConfirmationPage(page))) {
    await maybeSaveFieldInventory(page, CONFIRMATION_FIELDS_FILE(), true);
    throw new Error(
      `Sign completed but confirmation page was not reached (url=${page.url()}).`,
    );
  }

  const confirmation = await handleConfirmationPage(page);
  console.log(`Signed and submitted. Confirmation page: ${confirmation.url}`);
  return { submitted: true, confirmation };
}

async function fillWorkEducation3(page) {
  const fieldsFile = workspacePath("data/work-education-3.fields.json");
  const testFile = workspacePath("fixtures/work-education-3.test.json");
  const defaults = {
    clanOrTribe: "NO",
    languages: ["ENGLISH"],
    countriesVisited: "NO",
    organization: "NO",
    specializedSkills: "NO",
    militaryService: "NO",
    insurgentOrg: "NO",
  };
  let data = { ...defaults };
  try {
    data = { ...data, ...JSON.parse(await readFile(testFile, "utf8")) };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(testFile, `${JSON.stringify(data, null, 2)}\n`);
  }

  await maybeSaveFieldInventory(page, fieldsFile);

  for (const [partial, value] of [
    ["rblCLAN_TRIBE_IND", data.clanOrTribe],
    ["rblCOUNTRIES_VISITED_IND", data.countriesVisited],
    ["rblORGANIZATION_IND", data.organization],
    ["rblSPECIALIZED_SKILLS_IND", data.specializedSkills],
    ["rblMILITARY_SERVICE_IND", data.militaryService],
    ["rblINSURGENT_ORG_IND", data.insurgentOrg],
  ]) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    }
  }

  // Language list is required even when other answers are NO
  const languages = data.languages?.length ? data.languages : ["ENGLISH"];
  if (await pageHasPartialId(page, "tbxLANGUAGE_NAME")) {
    await fillTextByPartialId(page, "tbxLANGUAGE_NAME", languages[0]);
  }

  await maybeSaveFieldInventory(page, fieldsFile);
  console.log(
    `Additional Work/Education filled (languages=${languages.join(", ")})`,
  );
}

async function fillPreviousWorkEducation(page) {
  const fieldsFile = workspacePath("data/work-education-2.fields.json");
  const testFile = workspacePath("fixtures/work-education-2.test.json");
  const defaults = {
    previouslyEmployed: "NO",
    otherEducation: "NO",
  };
  let data = { ...defaults };
  try {
    data = { ...data, ...JSON.parse(await readFile(testFile, "utf8")) };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(testFile, `${JSON.stringify(data, null, 2)}\n`);
  }

  await maybeSaveFieldInventory(page, fieldsFile);

  for (const [partial, value] of [
    ["rblPreviouslyEmployed", data.previouslyEmployed],
    ["rblOtherEduc", data.otherEducation],
    ["rblPrevEmployed", data.previouslyEmployed],
    ["rblOtherEducation", data.otherEducation],
  ]) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    }
  }

  await answerAllVisibleYesNoRadios(page, "NO");
  await maybeSaveFieldInventory(page, fieldsFile);
  console.log(`Previous Work/Education filled from ${testFile}`);
}

async function fillWorkEducation(page) {
  const defaults = {
    occupation: "N",
    notEmployedExplain: "STUDENT",
    previouslyEmployed: "NO",
    otherEducation: "NO",
  };
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(WORK_EDUCATION_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      WORK_EDUCATION_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, WORK_EDUCATION_FIELDS_FILE());

  // Occupation AutoPostBack full-navigates and reveals employer / explain fields
  await selectWithPostback(page, "ddlPresentOccupation", data.occupation);

  // Wait for post-occupation UI (explain box for NOT EMPLOYED)
  await page
    .waitForFunction(
      () => {
        const partials = [
          "tbxExplainOtherPresentOccupation",
          "tbxEmpSchOther",
          "tbxOTHER_OCCUPATION",
          "tbxExplain",
          "tbxEmployerSchoolName",
          "tbxEmpSchName",
        ];
        const controls = [
          ...document.querySelectorAll("input, select, textarea"),
        ];
        return partials.some((partial) =>
          controls.some(
            (element) =>
              element.id.includes(partial) || element.name.includes(partial),
          ),
        );
      },
      { timeout: 10_000 },
    )
    .catch(() => null);

  const explainPartial = await findFirstPartialId(page, [
    "tbxExplainOtherPresentOccupation",
    "tbxEmpSchOther",
    "tbxOTHER_OCCUPATION",
    "tbxExplain",
  ]);
  if (explainPartial) {
    await fillTextByPartialId(
      page,
      explainPartial,
      data.notEmployedExplain || "NOT EMPLOYED",
    );
  } else {
    log("  WorkEducation1: no explain/employer field after occupation select");
  }

  // Employer/school block if present (other occupations)
  for (const [partial, value] of [
    ["tbxEmployerSchoolName", data.employerName],
    ["tbxEmpSchName", data.employerName],
    ["tbxWORK_EDUC_NAME", data.employerName],
  ]) {
    if (value && (await pageHasPartialId(page, partial))) {
      await fillTextByPartialId(page, partial, value);
    }
  }

  for (const [partial, value] of [
    ["rblPreviouslyEmployed", data.previouslyEmployed],
    ["rblOtherEduc", data.otherEducation],
  ]) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    }
  }

  // Any remaining Yes/No on this page → NO
  await answerAllVisibleYesNoRadios(page, "NO");

  await maybeSaveFieldInventory(page, WORK_EDUCATION_FIELDS_FILE());
  console.log(`Work/Education filled from ${WORK_EDUCATION_TEST_DATA_FILE()}`);
}

async function fillFamilyRelatives(page) {
  const defaults = {
    fatherSurname: "FATHER",
    fatherGivenNames: "TEST",
    fatherDobDay: "01",
    fatherDobMonth: "JAN",
    fatherDobYear: "1960",
    fatherLiveInUs: "NO",
    motherSurname: "MOTHER",
    motherGivenNames: "TEST",
    motherDobDay: "01",
    motherDobMonth: "JAN",
    motherDobYear: "1962",
    motherLiveInUs: "NO",
    immediateUsRelative: "NO",
    otherUsRelative: "NO",
  };
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(FAMILY_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      FAMILY_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, FAMILY_FIELDS_FILE());

  for (const [partial, value] of [
    ["rblFATHER_LIVE_IN_US_IND", data.fatherLiveInUs],
    ["rblMOTHER_LIVE_IN_US_IND", data.motherLiveInUs],
    ["rblUS_IMMED_RELATIVE_IND", data.immediateUsRelative],
    ["rblUS_OTHER_RELATIVE_IND", data.otherUsRelative],
  ]) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    }
  }

  await setCheckboxByPartialId(page, "cbxFATHER_SURNAME_UNK_IND", false);
  await setCheckboxByPartialId(page, "cbxFATHER_GIVEN_NAME_UNK_IND", false);
  await setCheckboxByPartialId(page, "cbxFATHER_DOB_UNK_IND", false);
  await fillTextByPartialId(page, "tbxFATHER_SURNAME", data.fatherSurname);
  await fillTextByPartialId(
    page,
    "tbxFATHER_GIVEN_NAME",
    data.fatherGivenNames,
  );
  await selectByPartialId(page, "ddlFathersDOBDay", data.fatherDobDay);
  await selectByPartialId(page, "ddlFathersDOBMonth", data.fatherDobMonth);
  await fillTextByPartialId(page, "tbxFathersDOBYear", data.fatherDobYear);

  await setCheckboxByPartialId(page, "cbxMOTHER_SURNAME_UNK_IND", false);
  await setCheckboxByPartialId(page, "cbxMOTHER_GIVEN_NAME_UNK_IND", false);
  await setCheckboxByPartialId(page, "cbxMOTHER_DOB_UNK_IND", false);
  await fillTextByPartialId(page, "tbxMOTHER_SURNAME", data.motherSurname);
  await fillTextByPartialId(
    page,
    "tbxMOTHER_GIVEN_NAME",
    data.motherGivenNames,
  );
  await selectByPartialId(page, "ddlMothersDOBDay", data.motherDobDay);
  await selectByPartialId(page, "ddlMothersDOBMonth", data.motherDobMonth);
  await fillTextByPartialId(page, "tbxMothersDOBYear", data.motherDobYear);

  await maybeSaveFieldInventory(page, FAMILY_FIELDS_FILE());
  console.log(`Family Relatives filled from ${FAMILY_TEST_DATA_FILE()}`);
}

async function fillUsContact(page) {
  const defaults = {
    surname: "CONTACT",
    givenNames: "TEST",
    organization: "TEST HOTEL",
    relationship: "FRIEND",
    street: "123 MAIN STREET",
    city: "NEW YORK",
    state: "NY",
    postalCode: "10001",
    phone: "2125550100",
    email: "us.contact@example.com",
  };
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(US_CONTACT_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      US_CONTACT_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, US_CONTACT_FIELDS_FILE());

  await setCheckboxByPartialId(page, "cbxUS_POC_NAME_NA", false);
  await fillTextByPartialId(page, "tbxUS_POC_SURNAME", data.surname);
  await fillTextByPartialId(page, "tbxUS_POC_GIVEN_NAME", data.givenNames);

  await setCheckboxByPartialId(page, "cbxUS_POC_ORG_NA_IND", false);
  await fillTextByPartialId(page, "tbxUS_POC_ORGANIZATION", data.organization);

  // Relationship AutoPostBack reveals the address/phone block
  await selectWithPostback(page, "ddlUS_POC_REL_TO_APP", data.relationship);

  const streetPartial = await page
    .waitForFunction(
      () => {
        const partials = [
          "tbxUS_POC_ADDR_LN1",
          "tbxUS_POC_STREET_ADDR1",
          "tbxUS_POC_ADDR_LINE1",
          "tbxStreetAddress1",
          "tbxUS_POC_ADDR",
        ];
        const controls = [
          ...document.querySelectorAll("input, select, textarea"),
        ];
        return (
          partials.find((partial) =>
            controls.some(
              (element) =>
                element.id.includes(partial) || element.name.includes(partial),
            ),
          ) || null
        );
      },
      { timeout: 15_000 },
    )
    .then((handle) => handle.jsonValue())
    .catch(() => null);

  if (!streetPartial) {
    await maybeSaveFieldInventory(page, US_CONTACT_FIELDS_FILE());
    const controls = await summarizeFormControls(page);
    throw new Error(
      `U.S. Contact address fields did not appear after relationship. Controls:\n  - ${controls
        .map(
          (control) =>
            `${control.id || control.name} | ${control.label || "-"}`,
        )
        .join("\n  - ")}`,
    );
  }

  const cityPartial =
    (await findFirstPartialId(page, [
      "tbxUS_POC_ADDR_CITY",
      "tbxUS_POC_CITY",
      "tbxCity",
    ])) || "tbxUS_POC_ADDR_CITY";
  const statePartial =
    (await findFirstPartialId(page, [
      "ddlUS_POC_STATE",
      "ddlUS_POC_ADDR_STATE",
      "ddlState",
      "tbxUS_POC_ADDR_STATE",
    ])) || "ddlUS_POC_STATE";
  const zipPartial =
    (await findFirstPartialId(page, [
      "tbxUS_POC_ADDR_POSTAL_CD",
      "tbxUS_POC_ZIP",
      "tbZIPCode",
      "tbxUS_POC_ADDR_ZIP",
    ])) || "tbxUS_POC_ADDR_POSTAL_CD";
  const phonePartial =
    (await findFirstPartialId(page, [
      "tbxUS_POC_HOME_TEL",
      "tbxUS_POC_PHONE",
      "tbxUS_POC_TEL",
      "tbxUS_POC_HOME_PHONE",
    ])) || "tbxUS_POC_HOME_TEL";
  const emailPartial =
    (await findFirstPartialId(page, [
      "tbxUS_POC_EMAIL_ADDR",
      "tbxUS_POC_EMAIL",
    ])) || "tbxUS_POC_EMAIL_ADDR";

  await fillTextByPartialId(page, streetPartial, data.street);
  await fillTextByPartialId(page, cityPartial, data.city);
  if (statePartial.startsWith("ddl") || statePartial.includes("ddl")) {
    await selectByPartialId(page, statePartial, data.state);
  } else {
    await fillTextByPartialId(page, statePartial, data.state);
  }
  if (await pageHasPartialId(page, zipPartial)) {
    await fillTextByPartialId(page, zipPartial, data.postalCode);
  }
  await fillTextByPartialId(page, phonePartial, data.phone);

  if (await pageHasPartialId(page, "cbxUS_POC_EMAIL_NA")) {
    await setCheckboxByPartialId(page, "cbxUS_POC_EMAIL_NA", false);
  }
  if (await pageHasPartialId(page, "cbexUS_POC_EMAIL_ADDR_NA")) {
    await setCheckboxByPartialId(page, "cbexUS_POC_EMAIL_ADDR_NA", false);
  }
  await fillTextByPartialId(page, emailPartial, data.email);

  await maybeSaveFieldInventory(page, US_CONTACT_FIELDS_FILE());
  console.log(
    `U.S. Contact filled (street=${streetPartial}, city=${cityPartial}, state=${statePartial}, phone=${phonePartial}, email=${emailPartial})`,
  );
}

async function fillPassportInformation(page) {
  const defaults = {
    passportType: "R",
    passportNumber: "X1234567",
    bookNumberDoesNotApply: true,
    issuedCountry: "IND",
    issuedCity: "HYDERABAD",
    issuedState: "TELANGANA",
    issuedInCountry: "IND",
    issuedDay: "01",
    issuedMonth: "JAN",
    issuedYear: "2020",
    expireDay: "01",
    expireMonth: "JAN",
    expireYear: "2030",
    lostStolen: "NO",
  };
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(PASSPORT_TEST_DATA_FILE(), "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      PASSPORT_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, PASSPORT_FIELDS_FILE());

  if (await pageHasPartialId(page, "rblLOST_PPT_IND")) {
    await chooseRadioWithPostback(page, "rblLOST_PPT_IND", data.lostStolen);
  }

  await selectByPartialId(page, "ddlPPT_TYPE", data.passportType);
  await fillTextByPartialId(page, "tbxPPT_NUM", data.passportNumber);

  if (data.bookNumberDoesNotApply) {
    await setCheckboxByPartialId(page, "cbexPPT_BOOK_NUM_NA", true);
  } else if (data.bookNumber) {
    await fillTextByPartialId(page, "tbxPPT_BOOK_NUM", data.bookNumber);
  }

  if (await pageHasPartialId(page, "ddlPPT_ISSUED_CNTRY")) {
    await selectByPartialId(page, "ddlPPT_ISSUED_CNTRY", data.issuedCountry);
  }
  await fillTextByPartialId(page, "tbxPPT_ISSUED_IN_CITY", data.issuedCity);
  await fillTextByPartialId(page, "tbxPPT_ISSUED_IN_STATE", data.issuedState);
  await selectByPartialId(page, "ddlPPT_ISSUED_IN_CNTRY", data.issuedInCountry);

  await selectByPartialId(page, "ddlPPT_ISSUED_DTEDay", data.issuedDay);
  await selectByPartialId(page, "ddlPPT_ISSUED_DTEMonth", data.issuedMonth);
  await fillTextByPartialId(page, "tbxPPT_ISSUEDYear", data.issuedYear);

  await selectByPartialId(page, "ddlPPT_EXPIRE_DTEDay", data.expireDay);
  await selectByPartialId(page, "ddlPPT_EXPIRE_DTEMonth", data.expireMonth);
  await fillTextByPartialId(page, "tbxPPT_EXPIREYear", data.expireYear);

  // CEAC uses cbxPPT_EXPIRE_NA (not cbex...) for "No Expiration"
  if (await pageHasPartialId(page, "cbxPPT_EXPIRE_NA")) {
    await setCheckboxByPartialId(page, "cbxPPT_EXPIRE_NA", false);
  }

  await maybeSaveFieldInventory(page, PASSPORT_FIELDS_FILE());
  console.log(`Passport Information filled from ${PASSPORT_TEST_DATA_FILE()}`);
}

async function fillPreviousUsTravel(page) {
  let data = { beenToUs: "NO", visaIssued: "NO", immigrantPetition: "NO" };
  try {
    data = {
      ...data,
      ...JSON.parse(
        await readFile(PREVIOUS_US_TRAVEL_TEST_DATA_FILE(), "utf8"),
      ),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(
      PREVIOUS_US_TRAVEL_TEST_DATA_FILE(),
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  await maybeSaveFieldInventory(page, PREVIOUS_US_TRAVEL_FIELDS_FILE());

  // Common CEAC radios on this page
  const known = [
    ["rblPREV_US_TRAVEL_IND", data.beenToUs],
    ["rblPREV_VISA_IND", data.visaIssued],
    ["rblPREV_VISA_CANCELLED_IND", "NO"],
    ["rblPREV_VISA_LOST_IND", "NO"],
    ["rblPREV_FILED_IMMIGRANT_PETITION_IND", data.immigrantPetition],
  ];

  for (const [partial, value] of known) {
    if (await pageHasPartialId(page, partial)) {
      await chooseRadioWithPostback(page, partial, value);
    } else {
      log(`  skip radio ${partial} (not on page)`);
    }
  }

  // Fallback: answer remaining visible YES/NO groups as NO
  await answerAllVisibleYesNoRadios(page, "NO");
  await maybeSaveFieldInventory(page, PREVIOUS_US_TRAVEL_FIELDS_FILE());
}

async function fillGenericMostlyNoPage(
  page,
  fieldsFile,
  testDataFile,
  defaults,
) {
  let data = { ...defaults };
  try {
    data = {
      ...data,
      ...JSON.parse(await readFile(testDataFile, "utf8")),
    };
  } catch {
    await mkdir(workspacePath("fixtures"), { recursive: true });
    await writeFile(testDataFile, `${JSON.stringify(data, null, 2)}\n`);
  }

  await maybeSaveFieldInventory(page, fieldsFile);

  // Apply any explicit radio mappings from fixture.radios
  if (data.radios && typeof data.radios === "object") {
    log(`  applying ${Object.keys(data.radios).length} radio mapping(s)`);
    for (const [partial, value] of Object.entries(data.radios)) {
      if (await pageHasPartialId(page, partial)) {
        await chooseRadioWithPostback(page, partial, value);
      } else {
        log(`  skip radio ${partial} (not on page)`);
      }
    }
  }

  // Apply text/select mappings
  if (data.texts && typeof data.texts === "object") {
    log(`  applying ${Object.keys(data.texts).length} text mapping(s)`);
    for (const [partial, value] of Object.entries(data.texts)) {
      if (await pageHasPartialId(page, partial)) {
        await fillTextByPartialId(page, partial, value);
      }
    }
  }
  if (data.selects && typeof data.selects === "object") {
    log(`  applying ${Object.keys(data.selects).length} select mapping(s)`);
    for (const [partial, value] of Object.entries(data.selects)) {
      if (await pageHasPartialId(page, partial)) {
        await selectByPartialId(page, partial, value);
      }
    }
  }
  if (data.checkboxes && typeof data.checkboxes === "object") {
    log(
      `  applying ${Object.keys(data.checkboxes).length} checkbox mapping(s)`,
    );
    for (const [partial, checked] of Object.entries(data.checkboxes)) {
      if (await pageHasPartialId(page, partial)) {
        await setCheckboxByPartialId(page, partial, Boolean(checked));
      }
    }
  }

  if (data.answerRemainingYesNo !== false) {
    await answerAllVisibleYesNoRadios(page, data.defaultYesNo ?? "NO");
  } else {
    log("  skip answerRemainingYesNo");
  }

  await maybeSaveFieldInventory(page, fieldsFile);
  return summarizeFormControls(page);
}

async function continueFromCurrentPage(page) {
  // Keep advancing through known/generic pages until Review/Sign/Photo.
  for (let step = 0; step < 25; step += 1) {
    const pageStarted = Date.now();
    const { url, node, title } = await getPageNode(page);
    log(`\n=== Page ${step + 1}: ${title} (${node || url}) ===`);
    await logPageState(page, "enter");

    // Post-submit confirmation (barcode / print page)
    if (
      /Confirm/i.test(`${node}`) ||
      /Confirmation/i.test(title) ||
      (await isConfirmationPage(page))
    ) {
      // Avoid treating SignCertify as confirmation before e-sign
      if (
        !/SignCertify|E-Signature and Certification/i.test(`${node} ${title}`)
      ) {
        await timed("handleConfirmationPage", () =>
          handleConfirmationPage(page),
        );
        log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
        return;
      }
    }

    // Sign & Submit (requires DS160_ALLOW_SUBMIT=true)
    if (
      /SignCertify|SignConfirm|Sign_?Submit|ElectronicSignature/i.test(
        `${node} ${url}`,
      ) ||
      /E-Signature and Certification|Sign and Submit/i.test(title)
    ) {
      const result = await timed("fillSignAndSubmit", () =>
        fillSignAndSubmit(page),
      );
      log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
      if (!result.submitted) {
        return;
      }
      return;
    }

    if (
      /Review/i.test(`${node} ${title}`) ||
      /Photo|UploadPhoto/i.test(`${node}`)
    ) {
      await maybeSaveFieldInventory(
        page,
        workspacePath(`data/${(node || "review").toLowerCase()}.fields.json`),
      );
      log(`Review/photo page — clicking Next (${node || title})`);
      await clickNext(page);
      log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
      continue;
    }

    const pageHandlers = [
      {
        match: () =>
          /Personal1/i.test(`${node}`) || /Personal Information 1/i.test(title),
        name: "Personal1",
        fill: fillPersonalInformationOne,
      },
      {
        match: () =>
          /Personal2/i.test(`${node}`) || /Personal Information 2/i.test(title),
        name: "Personal2",
        fill: fillPersonalInformationTwo,
      },
      {
        match: () =>
          /node=Travel(?!Companions)/i.test(url) ||
          /^Travel Information/i.test(title),
        name: "Travel",
        fill: fillTravelInformation,
      },
      {
        match: () => /TravelCompanions/i.test(`${node} ${url}`),
        name: "TravelCompanions",
        fill: fillTravelCompanions,
      },
      {
        match: () =>
          /PrevUSTravel|PreviousUSTravel|Previous.*Travel/i.test(
            `${node} ${url}${title}`,
          ),
        name: "PreviousUSTravel",
        fill: fillPreviousUsTravel,
      },
      {
        match: () =>
          /AddressPhone/i.test(`${node} ${url}`) ||
          /Address and Phone/i.test(title),
        name: "AddressPhone",
        fill: fillAddressAndPhone,
      },
      {
        match: () => /PptVisa|Passport/i.test(`${node} ${url}${title}`),
        name: "Passport",
        fill: fillPassportInformation,
      },
      {
        match: () =>
          /USContact/i.test(`${node} ${url}`) ||
          /U\.S\. Point of Contact|U\.S\. Contact/i.test(title),
        name: "USContact",
        fill: fillUsContact,
      },
      {
        match: () => /Relatives|Family/i.test(`${node} ${url}${title}`),
        name: "Family",
        fill: fillFamilyRelatives,
      },
      {
        match: () =>
          /WorkEducation1/i.test(`${node}`) ||
          /Present Work\/Education/i.test(title),
        name: "WorkEducation1",
        fill: fillWorkEducation,
      },
      {
        match: () =>
          /WorkEducation2/i.test(`${node}`) ||
          /Previous Work\/Education/i.test(title),
        name: "WorkEducation2",
        fill: fillPreviousWorkEducation,
      },
      {
        match: () =>
          /WorkEducation3/i.test(`${node}`) ||
          /Additional Work\/Education/i.test(title),
        name: "WorkEducation3",
        fill: fillWorkEducation3,
      },
    ];

    const handler = pageHandlers.find((candidate) => candidate.match());
    if (handler) {
      await timed(`fill ${handler.name}`, () => handler.fill(page));
      await clickNext(page);
      log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
      continue;
    }

    if (/Security|Background/i.test(`${node} ${url}${title}`)) {
      const suffix = (node || "security").toLowerCase();
      await timed(`fill Security (${suffix})`, async () => {
        await fillGenericMostlyNoPage(
          page,
          workspacePath(`data/security-background-${suffix}.fields.json`),
          SECURITY_BACKGROUND_TEST_DATA_FILE(),
          {
            answerRemainingYesNo: true,
            defaultYesNo: "NO",
          },
        );
        await maybeSaveFieldInventory(page, SECURITY_BACKGROUND_FIELDS_FILE());
      });
      await clickNext(page);
      log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
      continue;
    }

    // Unknown page: inventory + mostly-NO fallback, then try Next
    const unknownFile = workspacePath(
      `data/unknown-${(node || `step-${step}`).toLowerCase()}.fields.json`,
    );
    log(`unknown page handler for node=${node || step}`);
    const controls = await timed(`fill unknown (${node || step})`, () =>
      fillGenericMostlyNoPage(
        page,
        unknownFile,
        workspacePath(
          `fixtures/unknown-${(node || `step-${step}`).toLowerCase()}.test.json`,
        ),
        { answerRemainingYesNo: true, defaultYesNo: "NO" },
      ),
    );
    log(
      `Unknown page captured (${controls.length} controls). Attempting Next...`,
    );
    try {
      await clickNext(page);
      log(`page wall time ${formatMs(Date.now() - pageStarted)}`);
    } catch (error) {
      log(
        "Could not advance unknown page automatically. Browser left open for inspection.",
      );
      console.error(error.message);
      const summary = await summarizeFormControls(page);
      log("Visible controls:");
      for (const control of summary) {
        log(
          `  - ${control.id || control.name} | ${control.type} | ${control.label || "-"}`,
        );
      }
      return;
    }
  }

  log("Reached page-step limit; stopping.");
}

export async function runDs160Job(jobData, hooks = {}) {
  if (jobData?.meta) {
    configureJobContext({
      locationCode: jobData.meta.locationCode || jobContext.locationCode,
      securityAnswer: jobData.meta.securityAnswer || jobContext.securityAnswer,
      resumeApplication: Boolean(jobData.meta.applicationId),
      allowSubmit: Boolean(jobData.meta.allowSubmit),
    });
  }
  if (
    hooks &&
    (hooks.onCaptchaNeeded || hooks.onValidationError || hooks.onStatus)
  ) {
    configureJobContext({
      hooks: {
        onCaptchaNeeded:
          hooks.onCaptchaNeeded || jobContext.hooks.onCaptchaNeeded,
        onValidationError:
          hooks.onValidationError || jobContext.hooks.onValidationError,
        onStatus: hooks.onStatus || jobContext.hooks.onStatus,
      },
    });
  }
  jobContext.lastPdfPath = null;
  jobContext.lastConfirmation = null;
  jobContext.lastApplicationId = null;

  if (jobContext.hooks.onStatus) {
    await jobContext.hooks.onStatus("filling");
  }

  const browser = await puppeteer.launch({
    headless,
    defaultViewport: headless ? { width: 1280, height: 900 } : null,
    args: headless ? ["--disable-dev-shm-usage"] : ["--start-maximized"],
  });

  await browser
    .defaultBrowserContext()
    .setPermission(new URL(DS160_URL).origin, {
      permission: { name: "local-network-access" },
      state: "granted",
    });

  const [page] = await browser.pages();
  page.setDefaultTimeout(30_000);

  page.on("dialog", async (dialog) => {
    log(`Dialog: ${dialog.message() || "(empty)"}`);
    try {
      await dialog.accept();
    } catch {
      // already dismissed
    }
  });

  log(
    `Run start headless=${headless} verbose=${verboseTiming} resume=${resumeApplication()} allowSubmit=${allowSubmit()} probe=${probeConditionals} saveInventory=${saveInventories} postbackMs=${postbackTimeoutMs} selectPostbackMs=${selectPostbackTimeoutMs} settleMs=${postbackSettleMs}`,
  );

  try {
    await timed("goto CEAC home", () =>
      page.goto(DS160_URL, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }),
    );

    await page.waitForSelector(LOCATION_SELECTOR);

    const selectedLocation = await page.$eval(
      LOCATION_SELECTOR,
      (select, code) => {
        const option = [...select.options].find(
          (candidate) => candidate.value === code,
        );

        if (!option) {
          return null;
        }

        select.value = code;
        return option.textContent?.trim() ?? code;
      },
      locationCode(),
    );

    if (!selectedLocation) {
      throw new Error(
        `Unknown DS160_LOCATION "${locationCode()}". Set it to a valid location code.`,
      );
    }

    const locationPostback = page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.$eval(LOCATION_SELECTOR, (select) => {
      // CEAC uses an ASP.NET postback on change. Deferring the event lets this
      // evaluation finish before the current document is replaced.
      setTimeout(() => {
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }, 0);
    });

    await locationPostback;
    await page.waitForSelector(CAPTCHA_SELECTOR);

    console.log(`Selected location: ${selectedLocation}`);

    const session = await loadSession();
    const shouldResume =
      resumeApplication() ||
      (process.env.DS160_RESUME !== "false" &&
        Boolean(session?.applicationId) &&
        process.argv.includes("--resume"));

    while (await page.$(CAPTCHA_SELECTOR)) {
      const captcha = await promptForCaptcha(page);
      await page.click(CAPTCHA_SELECTOR, { clickCount: 3 });
      await page.type(CAPTCHA_SELECTOR, captcha);

      if (shouldResume && (await page.$(retrieveApplicationSelector))) {
        log("CAPTCHA entered. Retrieving existing application...");
        try {
          await timed("retrieveExistingApplication", () =>
            retrieveExistingApplication(page, session),
          );
          await logPageState(page, "after retrieve");
        } catch (error) {
          console.error(`Retrieve failed: ${error.message}`);
          log("Falling back to starting a new application...");
          await timed("startApplication (fallback)", () =>
            Promise.all([
              page.waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 60_000,
              }),
              page.click(START_APPLICATION_SELECTOR),
            ]),
          );
        }
      } else {
        log("CAPTCHA entered. Starting a new application...");
        await timed("startApplication", () =>
          Promise.all([
            page.waitForNavigation({
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            }),
            page.click(START_APPLICATION_SELECTOR),
          ]),
        );
      }

      if (await page.$(CAPTCHA_SELECTOR)) {
        console.log(
          "CEAC did not accept the CAPTCHA. A fresh image will be saved — enter the new code.",
        );
      }
    }

    // New-application setup path (skipped when retrieve lands in the form)
    const onSetupPage = /ConfirmApplicationID|SecureQuestion/i.test(page.url());
    if (onSetupPage) {
      console.log(`Application setup page opened: ${page.url()}`);
      console.log('Accepting the "I Agree" notice...');
      await clickAgreement(page);

      const applicationId = await readApplicationId(page);
      await configureSecurityQuestion(page);
      await saveApplicationId(applicationId);
      console.log(`Application ID saved to ${SESSION_FILE()}`);

      await clickContinue(page);
      console.log(`Application form opened: ${page.url()}`);
      await maybeSaveFieldInventory(page, PERSONAL_INFO_1_FIELDS_FILE());
      console.log(`Field inventory saved to ${PERSONAL_INFO_1_FIELDS_FILE()}`);

      await fillPersonalInformationOne(page);
      console.log(
        `Personal Information 1 filled with test data from ${PERSONAL_INFO_1_TEST_DATA_FILE()}`,
      );

      await clickNext(page);
      console.log(`Personal Information 2 opened: ${page.url()}`);
      await maybeSaveFieldInventory(page, PERSONAL_INFO_2_FIELDS_FILE());
      console.log(`Field inventory saved to ${PERSONAL_INFO_2_FIELDS_FILE()}`);

      await fillPersonalInformationTwo(page);
      console.log(
        `Personal Information 2 filled with test data from ${PERSONAL_INFO_2_TEST_DATA_FILE()}`,
      );

      await clickNext(page);
      console.log(`Travel Information opened: ${page.url()}`);
      await maybeSaveFieldInventory(page, TRAVEL_INFO_FIELDS_FILE());
      console.log(`Field inventory saved to ${TRAVEL_INFO_FIELDS_FILE()}`);

      await fillTravelInformation(page);
      console.log(
        `Travel Information filled with test data from ${TRAVEL_INFO_TEST_DATA_FILE()}`,
      );

      await clickNext(page);
      console.log(`Travel Companions page opened: ${page.url()}`);
    } else {
      console.log(`Resumed application at: ${page.url()}`);
    }

    // From Travel Companions (or whatever page resume landed on) through Review
    await timed("continueFromCurrentPage (all remaining pages)", () =>
      continueFromCurrentPage(page),
    );

    if (allowSubmit() && jobContext.hooks.onStatus) {
      await jobContext.hooks.onStatus("submitting");
    }

    printTimingSummary();
    log(
      allowSubmit()
        ? "Done. Confirmation artifacts saved; closing browser."
        : "Stopped before Sign and Submit (set DS160_ALLOW_SUBMIT=true to submit). Closing browser.",
    );
    await browser.close();
    log("Browser closed.");
    return {
      pdfPath: jobContext.lastPdfPath,
      confirmation: jobContext.lastConfirmation,
      applicationId: jobContext.lastApplicationId,
    };
  } catch (error) {
    try {
      await logPageValidationErrors(page, "Error on current page");
    } catch {
      // Page may already be closed or unavailable
    }
    printTimingSummary();
    try {
      await browser.close();
    } catch {
      // already closed
    }
    throw error;
  }
}

export { configureJobContext, jobContext, workspacePath };

import puppeteer from "puppeteer";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { resolve } from "node:path";

const port = process.argv[2] || "61593";

const browser = await puppeteer.connect({
  browserURL: `http://127.0.0.1:${port}`,
  defaultViewport: null,
});
const pages = await browser.pages();
const page =
  pages.find((p) => p.url().includes("ceac.state.gov")) || pages[0];

const payload = await page.evaluate(() => {
  const normalize = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
  const fields = [...document.querySelectorAll("input, select, textarea")]
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
      value: element.value,
      checked:
        element.type === "radio" || element.type === "checkbox"
          ? element.checked
          : undefined,
      options:
        element.tagName === "SELECT"
          ? [...element.options].map((option) => ({
              label: normalize(option.textContent),
              value: option.value,
            }))
          : undefined,
    }));

  const images = [...document.querySelectorAll("img")]
    .filter((img) => /captcha|valid|code|ocr/i.test(`${img.id} ${img.src} ${img.alt}`))
    .map((img) => ({ id: img.id, src: img.src, alt: img.alt }));

  return {
    pageTitle: document.title,
    url: location.href,
    savedAt: new Date().toISOString(),
    images,
    fields,
    bodyHints: (document.body?.innerText || "")
      .replace(/\s+/g, " ")
      .match(
        /Did anyone assist[\s\S]{0,200}|Passport Number[\s\S]{0,120}|Enter the characters[\s\S]{0,120}|Sign and Submit[\s\S]{0,80}/gi,
      ),
  };
});

const out = resolve("data/sign-submit.fields.json");
await mkdir(resolve("data"), { recursive: true, mode: 0o700 });
await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
await chmod(out, 0o600);

console.log(`Saved ${payload.fields.length} fields → ${out}`);
for (const f of payload.fields) {
  if (/ddlLanguage|ddlSite|btnModal|btnWarning|btnRecover|btnOk|btnCancel|btnClient|btnReview/i.test(f.id || "")) {
    continue;
  }
  console.log(
    `${f.type} | ${(f.id || "").replace(/.*FormView1_/, "").slice(0, 50)} | ${f.label || "-"} | val=${f.value ?? ""} checked=${f.checked}`,
  );
}
console.log("images", payload.images);
console.log("hints", payload.bodyHints);

await browser.disconnect();

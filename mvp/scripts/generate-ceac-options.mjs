/**
 * Build mvp/frontend/src/schema/ceac-options/options.json from
 * data/*.fields.json inventories + data/location.codes.json.
 *
 * Usage: node mvp/scripts/generate-ceac-options.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function loadJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}

function findSelect(fields, idPart) {
  return fields.find(
    (f) => f.type === "select" && String(f.id || "").includes(idPart),
  );
}

function extractOpts(sel) {
  return (sel?.options || [])
    .filter((o) => o.value !== "" && o.value != null)
    .map((o) => ({
      value: String(o.value),
      label: String(o.label || o.value).trim(),
    }));
}

function niceLabel(label) {
  return label
    .replace(/^\-\s*Select One\s*\-$/i, "")
    .split(/(\s+|\/|\(|\))/)
    .map((tok) => {
      if (!tok || /^\s+$/.test(tok) || tok === "/" || tok === "(" || tok === ")") {
        return tok;
      }
      if (/^[A-Z0-9]{1,5}$/.test(tok) && tok.length <= 3) return tok;
      return tok.charAt(0) + tok.slice(1).toLowerCase();
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function mapOpts(arr) {
  return arr
    .filter((o) => o.value && !/select one/i.test(o.label))
    .map((o) => ({ value: o.value, label: niceLabel(o.label) || o.value }));
}

function titleCaseLocation(label) {
  return label
    .split(", ")
    .map((part) =>
      part
        .split(/(\s+|\/)/)
        .map((w) => {
          if (w === " " || w === "/") return w;
          if (w.length <= 2 && w === w.toUpperCase()) return w;
          return w.charAt(0) + w.slice(1).toLowerCase();
        })
        .join(""),
    )
    .join(" — ");
}

const p1 = loadJson("data/personal-information-1.fields.json").fields;
const p2 = loadJson("data/personal-information-2.fields.json").fields;
const tr = loadJson("data/travel-information.fields.json").fields;
const tc = loadJson("data/travel-companions.group-no.fields.json").fields;
const ad = loadJson("data/address-phone.fields.json").fields;
const ppt = loadJson("data/passport.fields.json").fields;
const us = loadJson("data/us-contact.fields.json").fields;
const wk = loadJson("data/work-education.fields.json").fields;
const locationsDoc = loadJson("data/location.codes.json");

const locations = (locationsDoc.options || []).map((o) => ({
  value: o.value,
  label: titleCaseLocation(String(o.label).replace(/ — /g, ", ")),
}));

const out = {
  locations,
  countriesBirth: mapOpts(extractOpts(findSelect(p1, "ddlAPP_POB_CNTRY"))),
  countriesNationality: mapOpts(extractOpts(findSelect(p2, "ddlAPP_NATL"))),
  countriesAddress: mapOpts(extractOpts(findSelect(ad, "ddlCountry"))),
  countriesPassportIssued: mapOpts(
    extractOpts(findSelect(ppt, "ddlPPT_ISSUED_CNTRY")),
  ),
  countriesPassportIssuedIn: mapOpts(
    extractOpts(findSelect(ppt, "ddlPPT_ISSUED_IN_CNTRY")),
  ),
  usStates: mapOpts(extractOpts(findSelect(tr, "ddlTravelState"))),
  sex: mapOpts(extractOpts(findSelect(p1, "ddlAPP_GENDER"))),
  maritalStatus: mapOpts(extractOpts(findSelect(p1, "ddlAPP_MARITAL_STATUS"))),
  purposeOfTrip: mapOpts(extractOpts(findSelect(tr, "ddlPurposeOfTrip"))),
  otherPurpose: mapOpts(extractOpts(findSelect(tr, "ddlOtherPurpose"))),
  lengthOfStayUnit: mapOpts(extractOpts(findSelect(tr, "ddlTRAVEL_LOS_CD"))),
  payingForTrip: mapOpts(extractOpts(findSelect(tr, "ddlWhoIsPaying"))),
  companionRelationship: mapOpts(extractOpts(findSelect(tc, "ddlTCRelationship"))),
  usContactRelationship: mapOpts(
    extractOpts(findSelect(us, "ddlUS_POC_REL_TO_APP")),
  ),
  passportType: mapOpts(extractOpts(findSelect(ppt, "ddlPPT_TYPE"))),
  occupation: mapOpts(extractOpts(findSelect(wk, "ddlPresentOccupation"))),
  socialMedia: mapOpts(extractOpts(findSelect(ad, "ddlSocialMedia"))),
};

const outDir = resolve(root, "mvp/frontend/src/schema/ceac-options");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "options.json"), JSON.stringify(out, null, 2));

const indexTs = `/* AUTO-GENERATED — run: node mvp/scripts/generate-ceac-options.mjs */
import type { CeacOption } from "./types";
import raw from "./options.json";

export type { CeacOption };

export const INTERVIEW_LOCATIONS = raw.locations as CeacOption[];
export const COUNTRIES_BIRTH = raw.countriesBirth as CeacOption[];
export const COUNTRIES_NATIONALITY = raw.countriesNationality as CeacOption[];
export const COUNTRIES_ADDRESS = raw.countriesAddress as CeacOption[];
export const COUNTRIES_PASSPORT_ISSUED = raw.countriesPassportIssued as CeacOption[];
export const COUNTRIES_PASSPORT_ISSUED_IN =
  raw.countriesPassportIssuedIn as CeacOption[];
export const US_STATES = raw.usStates as CeacOption[];
export const SEX = raw.sex as CeacOption[];
export const MARITAL_STATUS = raw.maritalStatus as CeacOption[];
export const PURPOSE_OF_TRIP = raw.purposeOfTrip as CeacOption[];
export const OTHER_PURPOSE = raw.otherPurpose as CeacOption[];
export const LENGTH_OF_STAY_UNIT = raw.lengthOfStayUnit as CeacOption[];
export const PAYING_FOR_TRIP = raw.payingForTrip as CeacOption[];
export const COMPANION_RELATIONSHIP = raw.companionRelationship as CeacOption[];
export const US_CONTACT_RELATIONSHIP = raw.usContactRelationship as CeacOption[];
export const PASSPORT_TYPE = raw.passportType as CeacOption[];
export const OCCUPATION = raw.occupation as CeacOption[];
export const SOCIAL_MEDIA = raw.socialMedia as CeacOption[];

/** Schema $defs / __name → full CEAC option list */
export const ENUM_OPTIONS: Record<string, CeacOption[]> = {
  Sex: SEX,
  MaritalStatus: MARITAL_STATUS,
  PurposeOfTrip: PURPOSE_OF_TRIP,
  LengthOfStayUnit: LENGTH_OF_STAY_UNIT,
  PayingForTrip: PAYING_FOR_TRIP,
  CompanionRelationship: COMPANION_RELATIONSHIP,
  UsContactRelationship: US_CONTACT_RELATIONSHIP,
  PassportType: PASSPORT_TYPE,
  Occupation: OCCUPATION,
  SocialMediaPlatform: SOCIAL_MEDIA,
};
`;

writeFileSync(resolve(outDir, "types.ts"), `export type CeacOption = { value: string; label: string };\n`);
writeFileSync(resolve(outDir, "index.ts"), indexTs);

for (const [k, v] of Object.entries(out)) {
  console.log(`${k}: ${v.length}`);
}
console.log("Wrote", resolve(outDir, "options.json"));

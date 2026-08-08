/** Friendly labels + enum display text for schema-driven forms. */

export const FIELD_LABELS: Record<string, string> = {
  // meta
  locationCode: "U.S. embassy or consulate",
  securityAnswer: "Security question answer",
  applicationId: "Existing application ID (optional)",
  allowSubmit: "Allow final Sign & Submit",

  // personal 1
  surname: "Surname / family name",
  givenNames: "Given names (first + middle)",
  fullNameNativeAlphabetDoesNotApply: "Full name in native alphabet does not apply",
  fullNameNativeAlphabet: "Full name in native alphabet",
  otherNamesUsed: "Have you used other names?",
  otherNames: "Other names",
  telecodeNameUsed: "Do you have a telecode for your name?",
  telecodeSurname: "Telecode surname",
  telecodeGivenNames: "Telecode given names",
  sex: "Sex",
  maritalStatus: "Marital status",
  dateOfBirth: "Date of birth",
  cityOfBirth: "City of birth",
  stateProvinceOfBirth: "State / province of birth",
  stateProvinceOfBirthDoesNotApply: "State / province of birth does not apply",
  countryRegionOfBirth: "Country / region of birth",

  // personal 2
  nationality: "Nationality",
  hasOtherNationality: "Do you hold other nationalities?",
  otherNationalities: "Other nationalities",
  isPermanentResidentOfOtherCountry:
    "Permanent resident of another country?",
  permanentResidentCountries: "Permanent resident countries",
  nationalIdentificationNumber: "National ID number",
  nationalIdentificationNumberDoesNotApply: "I do not have a national ID number",
  hasSSN: "Do you have a U.S. Social Security Number?",
  ssn: "Social Security Number",
  hasTaxpayerID: "Do you have a U.S. Taxpayer ID?",
  taxpayerId: "Taxpayer ID",

  // travel
  purposeOfTrip: "Purpose of trip",
  otherPurpose: "Specify visa class",
  hasSpecificTravelPlans: "Do you have specific travel plans?",
  arrivalDate: "Intended arrival date",
  lengthOfStay: "Length of stay",
  duration: "Duration",
  unit: "Unit",
  usAddress: "Address where you will stay in the U.S.",
  street: "Street address",
  street2: "Street address line 2",
  city: "City",
  state: "State",
  zipCode: "ZIP code",
  postalCode: "Postal code",
  payingForTrip: "Who is paying for your trip?",

  // companions
  otherPersonsTravelingWithYou: "Traveling with others?",
  travelingAsGroup: "Traveling as a group / tour?",
  groupName: "Group name",
  companions: "Travel companions",
  relationship: "Relationship",

  // previous US
  beenToUs: "Have you ever been to the U.S.?",
  visaIssued: "Have you ever been issued a U.S. visa?",
  immigrantPetition: "Has an immigrant petition been filed for you?",

  // address
  country: "Country",
  mailingSameAsHome: "Mailing address same as home?",
  mailingAddress: "Mailing address",
  primaryPhone: "Primary phone",
  workPhone: "Work phone",
  workPhoneDoesNotApply: "No work phone",
  secondaryPhone: "Mobile / secondary phone",
  secondaryPhoneDoesNotApply: "No secondary phone",
  email: "Email address",
  additionalPhone: "Add another phone number?",
  additionalEmail: "Add another email?",
  socialMedia: "Do you use social media?",
  socialMediaPlatform: "Social media platform",
  socialMediaIdentifier: "Social media username / ID",

  // passport
  passportType: "Passport type",
  passportNumber: "Passport number",
  bookNumber: "Passport book number",
  bookNumberDoesNotApply: "Passport book number does not apply",
  issuedCountry: "Country that issued passport",
  issuedCity: "City where passport was issued",
  issuedState: "State / province where issued",
  issuedInCountry: "Country where passport was issued",
  issuedDay: "Issue day",
  issuedMonth: "Issue month",
  issuedYear: "Issue year",
  expireDay: "Expiration day",
  expireMonth: "Expiration month",
  expireYear: "Expiration year",
  lostStolen: "Have you ever lost a passport or had one stolen?",

  // US contact
  organization: "Organization",
  organizationDoesNotApply: "Organization does not apply",
  nameDoesNotApply: "Contact name does not apply",
  emailDoesNotApply: "Email does not apply",
  phone: "Phone",

  // family
  fatherSurname: "Father’s surname",
  fatherGivenNames: "Father’s given names",
  fatherDobDay: "Father’s birth day",
  fatherDobMonth: "Father’s birth month",
  fatherDobYear: "Father’s birth year",
  fatherLiveInUs: "Does your father live in the U.S.?",
  motherSurname: "Mother’s surname",
  motherGivenNames: "Mother’s given names",
  motherDobDay: "Mother’s birth day",
  motherDobMonth: "Mother’s birth month",
  motherDobYear: "Mother’s birth year",
  motherLiveInUs: "Does your mother live in the U.S.?",
  immediateUsRelative: "Do you have immediate relatives in the U.S.?",
  otherUsRelative: "Do you have other relatives in the U.S.?",

  // work
  occupation: "Present occupation",
  notEmployedExplain: "Explain (if not employed / other)",
  employerName: "Employer / school name",
  previouslyEmployed: "Were you previously employed?",
  otherEducation: "Have you attended other educational institutions?",
  clanOrTribe: "Are you a member of a clan or tribe?",
  languages: "Languages you speak",
  countriesVisited: "Have you traveled to other countries?",
  specializedSkills: "Specialized skills?",
  militaryService: "Military service?",
  insurgentOrg: "Insurgent / rebel organization?",

  // security
  answerRemainingYesNo: "Answer remaining security questions automatically",
  defaultYesNo: "Default answer for security questions",

  // sign
  assistedByPreparer: "Was this application assisted by a preparer?",
};

/** Wire value → user-facing label */
export const ENUM_LABELS: Record<string, Record<string, string>> = {
  YesNo: { YES: "Yes", NO: "No" },
  Sex: { M: "Male", F: "Female" },
  MaritalStatus: {
    M: "Married",
    C: "Common law marriage",
    P: "Civil union / domestic partnership",
    S: "Single",
    W: "Widowed",
    D: "Divorced",
    L: "Legally separated",
    O: "Other",
  },
  PurposeOfTrip: {
    B: "Temp. business / pleasure / medical (B)",
    F: "Student (F)",
    J: "Exchange visitor (J)",
    H: "Temporary worker (H)",
    L: "Intracompany transferee (L)",
    A: "Diplomatic / official (A)",
    C: "Transit (C)",
    E: "Treaty trader / investor (E)",
    G: "International organization (G)",
    I: "Media (I)",
    K: "Fiancé(e) (K)",
    M: "Vocational student (M)",
    O: "Extraordinary ability (O)",
    P: "Athlete / entertainer (P)",
    R: "Religious worker (R)",
  },
  LengthOfStayUnit: {
    Y: "Years",
    M: "Months",
    W: "Weeks",
    D: "Days",
    H: "Hours",
  },
  PayingForTrip: {
    S: "Self",
    O: "Other person",
    P: "Present employer",
    U: "U.S. employer",
    C: "Other company / organization",
  },
  CompanionRelationship: {
    P: "Parent",
    S: "Spouse",
    C: "Child",
    R: "Other relative",
    F: "Friend",
    B: "Business associate",
    O: "Other",
  },
  UsContactRelationship: {
    R: "Relative",
    S: "Spouse",
    C: "Friend",
    B: "Business associate",
    P: "Employer",
    H: "School official",
    O: "Other",
  },
  PassportType: {
    R: "Regular",
    O: "Official",
    D: "Diplomatic",
    L: "Laissez-passer",
    T: "Other",
  },
  Occupation: {
    A: "Agriculture",
    AP: "Artist / performer",
    B: "Business",
    CM: "Communications",
    CS: "Computer science",
    C: "Culinary / food services",
    ED: "Education",
    EN: "Engineering",
    G: "Government",
    H: "Homemaker",
    LP: "Legal profession",
    MH: "Medical / health",
    M: "Military",
    NS: "Natural science",
    N: "Not employed",
    PS: "Physical sciences",
    RV: "Religious vocation",
    R: "Research",
    RT: "Retired",
    SS: "Social science",
    S: "Student",
    O: "Other",
  },
  SocialMediaPlatform: {
    FCBK: "Facebook",
    INST: "Instagram",
    TWIT: "Twitter / X",
    LINK: "LinkedIn",
    YTUB: "YouTube",
    NONE: "None",
    GOGL: "Google+",
    TWBO: "Twibo",
    RDDT: "Reddit",
  },
};

export {
  INTERVIEW_LOCATIONS,
  US_STATES,
  COUNTRIES_BIRTH,
  COUNTRIES_NATIONALITY,
  COUNTRIES_ADDRESS,
  COUNTRIES_PASSPORT_ISSUED,
  COUNTRIES_PASSPORT_ISSUED_IN,
  OTHER_PURPOSE,
  ENUM_OPTIONS,
} from "./ceac-options";

import type { CeacOption } from "./ceac-options";
import {
  COUNTRIES_ADDRESS,
  COUNTRIES_BIRTH,
  COUNTRIES_NATIONALITY,
  COUNTRIES_PASSPORT_ISSUED,
  COUNTRIES_PASSPORT_ISSUED_IN,
  ENUM_OPTIONS,
} from "./ceac-options";

/** Pick the CEAC country list that matches this field. */
export function countriesForField(
  name: string,
  path: string,
): CeacOption[] {
  if (/nationality|otherNationalit|permanentResident/i.test(name + path)) {
    return COUNTRIES_NATIONALITY;
  }
  if (/issuedCountry/i.test(name)) return COUNTRIES_PASSPORT_ISSUED;
  if (/issuedInCountry/i.test(name)) return COUNTRIES_PASSPORT_ISSUED_IN;
  if (
    /countryOfBirth|countryRegionOfBirth|POB/i.test(name) ||
    /personalInformation1/i.test(path)
  ) {
    return COUNTRIES_BIRTH;
  }
  if (/addressPhone|mailingAddress|usContact|TravelUsAddress/i.test(path)) {
    return COUNTRIES_ADDRESS;
  }
  if (/issuedCountry|passport/i.test(path)) return COUNTRIES_PASSPORT_ISSUED;
  return COUNTRIES_BIRTH;
}

/** Map CEAC / wire error text to something a person can act on. */
export function friendlyCeacMessage(message: string): string {
  const m = message.trim();
  if (/national.?id|APP_NATIONAL_ID/i.test(m)) {
    return "National ID number is missing or invalid. Enter it, or check “I do not have a national ID number”.";
  }
  if (/surname|APP_SURNAME/i.test(m)) {
    return "Please check the surname / family name.";
  }
  if (/given.?name|APP_GIVEN/i.test(m)) {
    return "Please check the given names.";
  }
  if (/passport/i.test(m)) {
    return "Please check the passport information.";
  }
  if (/date.?of.?birth|DOB|birth/i.test(m)) {
    return "Please check the date of birth.";
  }
  if (/email/i.test(m)) {
    return "Please check the email address.";
  }
  if (/phone|telephone/i.test(m)) {
    return "Please check the phone number.";
  }
  // Strip raw control ids like tbxAPP_FOO from the end
  const cleaned = m
    .replace(/\b(tbx|ddl|rbl|cbex)[A-Z0-9_]+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Please correct this field and try again.";
}

export const STATUS_LABELS: Record<string, string> = {
  connecting: "Connecting…",
  queued: "Queued",
  filling: "Filling form",
  awaiting_captcha: "CAPTCHA needed",
  awaiting_correction: "Needs your corrections",
  submitting: "Submitting",
  completed: "Completed",
  failed: "Failed",
};

export function labelFor(name: string, fallback?: string): string {
  return FIELD_LABELS[name] || fallback || humanize(name);
}

export function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/Dna|Does Not Apply/gi, (m) => m)
    .trim();
}

export function enumLabel(
  typeName: string | undefined,
  value: string,
): string {
  if (typeName && ENUM_OPTIONS[typeName]) {
    const hit = ENUM_OPTIONS[typeName].find((o) => o.value === value);
    if (hit) return hit.label;
  }
  if (typeName && ENUM_LABELS[typeName]?.[value]) {
    return ENUM_LABELS[typeName][value];
  }
  if (value === "YES") return "Yes";
  if (value === "NO") return "No";
  return value;
}

/** Full CEAC options for a schema enum type, falling back to schema.enum values. */
export function optionsForEnum(
  typeName: string | undefined,
  schemaEnum?: Array<string | number | boolean>,
): CeacOption[] {
  if (typeName && ENUM_OPTIONS[typeName]?.length) {
    return ENUM_OPTIONS[typeName];
  }
  return (schemaEnum ?? []).map((v) => {
    const value = String(v);
    return { value, label: enumLabel(typeName, value) };
  });
}

export function friendlyHelp(
  description?: string,
  fieldName?: string,
): string | undefined {
  if (fieldName === "locationCode") {
    return "Choose where you will apply for your visa interview.";
  }
  if (!description) return undefined;
  // Hide raw CEAC control ids like tbxAPP_SURNAME / ddlAPP_GENDER
  if (/^(tbx|ddl|rbl|cbex|PPT)/i.test(description.trim())) return undefined;
  if (/DS160_LOCATION|Consulate\/post code/i.test(description)) {
    return "Choose where you will apply for your visa interview.";
  }
  if (/wire values|ddl[A-Z]/i.test(description)) {
    // Keep human part after colon if present
    const after = description.split(":").slice(1).join(":").trim();
    return after || undefined;
  }
  return description;
}

export function isCountryField(name: string, typeName?: string): boolean {
  return (
    typeName === "CountryCode" ||
    /nationality|country|issuedCountry|issuedInCountry|countryRegion/i.test(
      name,
    )
  );
}

export function isUsStateField(name: string, path: string): boolean {
  return (
    (name === "state" && /usAddress|usContact|TravelUsAddress/i.test(path)) ||
    name === "UsStateCode"
  );
}

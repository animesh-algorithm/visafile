/* AUTO-GENERATED — run: node mvp/scripts/generate-ceac-options.mjs */
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

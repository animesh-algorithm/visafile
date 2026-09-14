import rawOptions from "./ceac-options.json";

export interface CeacOption {
  value: string;
  label: string;
}

type OptionSet = keyof typeof rawOptions;

function options(name: OptionSet): CeacOption[] {
  return rawOptions[name] as CeacOption[];
}

export const INTERVIEW_LOCATIONS = options("locations");
export const COUNTRIES_BIRTH = options("countriesBirth");
export const COUNTRIES_NATIONALITY = options("countriesNationality");
export const COUNTRIES_ADDRESS = options("countriesAddress");
export const COUNTRIES_PASSPORT_ISSUED = options("countriesPassportIssued");
export const COUNTRIES_PASSPORT_ISSUED_IN = options(
  "countriesPassportIssuedIn",
);
export const US_STATES = options("usStates");
export const SEX = options("sex");
export const MARITAL_STATUS = options("maritalStatus");
export const PURPOSE_OF_TRIP = options("purposeOfTrip");
export const OTHER_PURPOSE = options("otherPurpose");
export const LENGTH_OF_STAY_UNIT = options("lengthOfStayUnit");
export const PAYING_FOR_TRIP = options("payingForTrip");
export const US_CONTACT_RELATIONSHIP = options("usContactRelationship");
export const PASSPORT_TYPE = options("passportType");
export const OCCUPATION = options("occupation");

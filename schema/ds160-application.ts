/**
 * DS-160 applicant data contract
 *
 * Shared shape for frontend form → backend API → Puppeteer worker.
 * Section keys mirror CEAC pages; property names match fixtures/*.test.json
 * (see APPLICANT_DATA.md). Enums prefer CEAC wire values from data/*.fields.json.
 *
 * Worker note: selectByPartialId currently accepts option value OR label, so
 * fixtures may still use "MALE"/"INDIA"/"FRIEND". New code should emit wire
 * values (M / IND / F for companions, C for US-contact Friend).
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** CEAC Yes/No radio value (uppercase). */
export type YesNo = "YES" | "NO";

/** Zero-padded day used on Personal / Family / Passport date dropdowns. */
export type DayPad =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"
  | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20"
  | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30"
  | "31";

/** Unpadded day used on Travel Information arrival date. */
export type DayNum =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20"
  | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30"
  | "31";

/** Month codes used on Personal / Family DOB (and accepted as passport labels). */
export type MonthCode =
  | "JAN" | "FEB" | "MAR" | "APR" | "MAY" | "JUN"
  | "JUL" | "AUG" | "SEP" | "OCT" | "NOV" | "DEC";

/** Numeric month values on Travel Information arrival (ddlTRAVEL_DTEMonth). */
export type MonthNum =
  | "1" | "2" | "3" | "4" | "5" | "6"
  | "7" | "8" | "9" | "10" | "11" | "12";

/** Zero-padded month values on Passport issue/expire (ddlPPT_*_DTEMonth). */
export type MonthPad =
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12";

/** Four-digit year string, e.g. "1990". */
export type Year = string;

/**
 * CEAC country/region code (e.g. "IND", "AFGH").
 * Full option lists live in data/*.fields.json inventories (~200–280 entries).
 */
export type CountryCode = string;

/** US state code for in-US address dropdowns (e.g. "NY"). */
export type UsStateCode = string;

export interface DatePartsMonthCode {
  day: DayPad;
  month: MonthCode;
  year: Year;
}

export interface DatePartsMonthNum {
  day: DayNum;
  month: MonthNum;
  year: Year;
}

export interface DatePartsMonthPad {
  day: DayPad;
  month: MonthPad;
  year: Year;
}

/** Security / background answer: NO, or YES with required explanation. */
export type YesNoExplain =
  | { answer: "NO" }
  | { answer: "YES"; explain: string };

// ---------------------------------------------------------------------------
// Enums (CEAC wire values)
// ---------------------------------------------------------------------------

/** ddlAPP_GENDER */
export type Sex = "M" | "F";

/** ddlAPP_MARITAL_STATUS */
export type MaritalStatus =
  | "M" // MARRIED
  | "C" // COMMON LAW MARRIAGE
  | "P" // CIVIL UNION/DOMESTIC PARTNERSHIP
  | "S" // SINGLE
  | "W" // WIDOWED
  | "D" // DIVORCED
  | "L" // LEGALLY SEPARATED
  | "O"; // OTHER

/** ddlPurposeOfTrip */
export type PurposeOfTrip =
  | "A" | "B" | "C" | "CNMI" | "D" | "E" | "F" | "G" | "H" | "I" | "J"
  | "K" | "L" | "M" | "N" | "NATO" | "O" | "P" | "Q" | "R" | "S" | "T"
  | "TD/TN" | "U" | "PAROLE-BEN";

/**
 * ddlOtherPurpose — depends on purposeOfTrip postback.
 * B-class values shown; other purposes have different option sets.
 */
export type OtherPurposeB = "B1-B2" | "B1-CF" | "B2-TM";
export type OtherPurpose = OtherPurposeB | string;

/** ddlTRAVEL_LOS_CD */
export type LengthOfStayUnit = "Y" | "M" | "W" | "D" | "H";

/** ddlWhoIsPaying */
export type PayingForTrip =
  | "S" // Self
  | "O" // Other Person
  | "P" // Present Employer
  | "U" // Employer in the U.S.
  | "C"; // Other Company/Organization

/** ddlTCRelationship (Travel Companions) — Friend = F */
export type CompanionRelationship =
  | "P" // PARENT
  | "S" // SPOUSE
  | "C" // CHILD
  | "R" // OTHER RELATIVE
  | "F" // FRIEND
  | "B" // BUSINESS ASSOCIATE
  | "O"; // OTHER

/** ddlUS_POC_REL_TO_APP — Friend = C (different from companions!) */
export type UsContactRelationship =
  | "R" // RELATIVE
  | "S" // SPOUSE
  | "C" // FRIEND
  | "B" // BUSINESS ASSOCIATE
  | "P" // EMPLOYER
  | "H" // SCHOOL OFFICIAL
  | "O"; // OTHER

/** ddlPPT_TYPE */
export type PassportType =
  | "R" // REGULAR
  | "O" // OFFICIAL
  | "D" // DIPLOMATIC
  | "L" // LAISSEZ-PASSER
  | "T"; // OTHER

/** ddlPresentOccupation */
export type Occupation =
  | "A"  // AGRICULTURE
  | "AP" // ARTIST/PERFORMER
  | "B"  // BUSINESS
  | "CM" // COMMUNICATIONS
  | "CS" // COMPUTER SCIENCE
  | "C"  // CULINARY/FOOD SERVICES
  | "ED" // EDUCATION
  | "EN" // ENGINEERING
  | "G"  // GOVERNMENT
  | "H"  // HOMEMAKER
  | "LP" // LEGAL PROFESSION
  | "MH" // MEDICAL/HEALTH
  | "M"  // MILITARY
  | "NS" // NATURAL SCIENCE
  | "N"  // NOT EMPLOYED
  | "PS" // PHYSICAL SCIENCES
  | "RV" // RELIGIOUS VOCATION
  | "R"  // RESEARCH
  | "RT" // RETIRED
  | "SS" // SOCIAL SCIENCE
  | "S"  // STUDENT
  | "O"; // OTHER

/** ddlSocialMedia (exclude placeholder SONE) */
export type SocialMediaPlatform =
  | "ASKF" | "DUBN" | "FCBK" | "FLKR" | "GOGL" | "INST" | "LINK" | "MYSP"
  | "PTST" | "QZNE" | "RDDT" | "SWBO" | "TWBO" | "TUMB" | "TWIT" | "TWOO"
  | "VINE" | "VKON" | "YUKU" | "YTUB" | "NONE";

// ---------------------------------------------------------------------------
// Meta (session / env — not a CEAC page fixture)
// ---------------------------------------------------------------------------

export interface Ds160Meta {
  /** Consulate / post code, e.g. "HYD". Maps to DS160_LOCATION. */
  locationCode: string;
  /** Security question answer chosen at application start. */
  securityAnswer: string;
  /** CEAC Application ID when resuming. */
  applicationId?: string;
  /** When true, worker may click Sign and Submit. Default false. */
  allowSubmit?: boolean;
}

// ---------------------------------------------------------------------------
// 1. Personal Information 1  (node=Personal1)
//    fixture: fixtures/personal-information-1.test.json
//    fields:  data/personal-information-1.fields.json
// ---------------------------------------------------------------------------

export interface PersonalInformation1 {
  /** tbxAPP_SURNAME — passport surname */
  surname: string;
  /** tbxAPP_GIVEN_NAME — use "FNU" if none */
  givenNames: string;
  /**
   * cbexAPP_FULL_NAME_NATIVE_NA
   * If false, fullNameNativeAlphabet is required (worker does not fill yet).
   */
  fullNameNativeAlphabetDoesNotApply: boolean;
  /** tbxAPP_FULL_NAME_NATIVE — when DNA is unchecked */
  fullNameNativeAlphabet?: string;
  /** rblOtherNames — YES reveals other-name rows (not filled by worker yet) */
  otherNamesUsed: YesNo;
  otherNames?: Array<{ surname: string; givenNames: string }>;
  /** rblTelecodeQuestion */
  telecodeNameUsed: YesNo;
  telecodeSurname?: string;
  telecodeGivenNames?: string;
  /** ddlAPP_GENDER — wire M/F */
  sex: Sex;
  /** ddlAPP_MARITAL_STATUS */
  maritalStatus: MaritalStatus;
  /** ddlDOBDay / ddlDOBMonth / tbxDOBYear */
  dateOfBirth: DatePartsMonthCode;
  /** tbxAPP_POB_CITY */
  cityOfBirth: string;
  /** tbxAPP_POB_ST_PROVINCE — omit/empty when doesNotApply */
  stateProvinceOfBirth?: string;
  /** cbexAPP_POB_ST_PROVINCE_NA */
  stateProvinceOfBirthDoesNotApply: boolean;
  /** ddlAPP_POB_CNTRY */
  countryRegionOfBirth: CountryCode;
}

// ---------------------------------------------------------------------------
// 2. Personal Information 2  (node=Personal2)
//    fixture: fixtures/personal-information-2.test.json
// ---------------------------------------------------------------------------

export interface PersonalInformation2 {
  /** ddlAPP_NATL */
  nationality: CountryCode;
  /** rblAPP_OTH_NATL_IND — YES → other nationality / passport details */
  hasOtherNationality: YesNo;
  otherNationalities?: Array<{
    nationality: CountryCode;
    hasPassport: YesNo;
    passportNumber?: string;
  }>;
  /** rblPermResOtherCntryInd */
  isPermanentResidentOfOtherCountry: YesNo;
  permanentResidentCountries?: CountryCode[];
  /**
   * tbxAPP_NATIONAL_ID — omit and set nationalIdentificationNumberDoesNotApply
   * when DNA (checkbox cbexAPP_NATIONAL_ID_NA).
   */
  nationalIdentificationNumber?: string;
  nationalIdentificationNumberDoesNotApply?: boolean;
  /**
   * Worker today: hasSSN "NO" checks cbexAPP_SSN_NA.
   * YES path should send ssn parts (tbxAPP_SSN1/2/3).
   */
  hasSSN: YesNo;
  ssn?: { area: string; group: string; serial: string };
  /** hasTaxpayerID "NO" → cbexAPP_TAX_ID_NA */
  hasTaxpayerID: YesNo;
  taxpayerId?: string;
}

// ---------------------------------------------------------------------------
// 3. Travel Information  (node=Travel)
//    fixture: fixtures/travel-information.test.json
// ---------------------------------------------------------------------------

export interface TravelUsAddress {
  /** tbxStreetAddress1 */
  street: string;
  /** tbxStreetAddress2 */
  street2?: string;
  /** tbxCity */
  city: string;
  /** ddlTravelState — code or label */
  state: UsStateCode | string;
  /** tbZIPCode */
  zipCode?: string;
}

export interface LengthOfStay {
  /** tbxTRAVEL_LOS */
  duration: string;
  /** ddlTRAVEL_LOS_CD */
  unit: LengthOfStayUnit;
}

export interface TravelInformation {
  /** ddlPurposeOfTrip (postback) */
  purposeOfTrip: PurposeOfTrip;
  /** ddlOtherPurpose — required after purpose postback */
  otherPurpose: OtherPurpose;
  /**
   * rblSpecificTravel
   * YES reveals flight/city fields; NO still requires intended arrival,
   * length of stay, and US stay address for typical B paths.
   */
  hasSpecificTravelPlans: YesNo;
  /** Specific-plans branch (not filled by worker yet) */
  arrivalFlight?: string;
  arrivalCity?: string;
  departureDate?: DatePartsMonthNum;
  departureFlight?: string;
  departureCity?: string;
  locationsToVisit?: string[];
  /** Intended arrival — ddlTRAVEL_DTE* (month is numeric wire value) */
  arrivalDate?: DatePartsMonthNum;
  lengthOfStay?: LengthOfStay;
  usAddress?: TravelUsAddress;
  /** ddlWhoIsPaying — non-Self reveals payer detail fields (not filled yet) */
  payingForTrip: PayingForTrip;
  payer?: {
    surname?: string;
    givenNames?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    address?: TravelUsAddress & { country?: CountryCode };
  };
}

// ---------------------------------------------------------------------------
// 4. Travel Companions  (node=TravelCompanions)
//    fixture: fixtures/travel-companions.test.json
// ---------------------------------------------------------------------------

export interface TravelCompanion {
  surname: string;
  givenNames: string;
  /** ddlTCRelationship — Friend wire is F */
  relationship: CompanionRelationship;
}

export interface TravelCompanions {
  /** rblOtherPersonsTravelingWithYou */
  otherPersonsTravelingWithYou: YesNo;
  /** rblGroupTravel — only when traveling with others */
  travelingAsGroup?: YesNo;
  /** tbxGroupName — when travelingAsGroup = YES */
  groupName?: string;
  /** Companion repeater — when traveling with others and not as a named group */
  companions?: TravelCompanion[];
}

// ---------------------------------------------------------------------------
// 5. Previous U.S. Travel  (node=PreviousUSTravel)
//    fixture: fixtures/previous-us-travel.test.json
// ---------------------------------------------------------------------------

export interface PreviousUsTravel {
  /** rblPREV_US_TRAVEL_IND */
  beenToUs: YesNo;
  previousVisits?: Array<{
    arrivalDate: DatePartsMonthCode;
    lengthOfStay: LengthOfStay;
  }>;
  /** Driver's license branch when beenToUs / prompted */
  hasUsDriversLicense?: YesNo;
  usDriversLicenses?: Array<{ number: string; state: UsStateCode }>;
  /** rblPREV_VISA_IND */
  visaIssued: YesNo;
  lastVisa?: {
    issuedDate: DatePartsMonthCode;
    visaNumber?: string;
    sameType: YesNo;
    sameLocation: YesNo;
    tenPrinted: YesNo;
  };
  /** rblPREV_VISA_LOST_IND — worker hardcodes NO when visible */
  visaLostStolen?: YesNo;
  visaLostStolenExplain?: string;
  /** rblPREV_VISA_CANCELLED_IND — worker hardcodes NO when visible */
  visaCancelled?: YesNo;
  visaCancelledExplain?: string;
  /** rblPREV_VISA_REFUSED_IND */
  visaRefused?: YesNo;
  visaRefusedExplain?: string;
  /**
   * Immigrant petition filed for applicant.
   * Live CEAC control: rblIV_PETITION_IND
   * (worker historically looked for rblPREV_FILED_IMMIGRANT_PETITION_IND).
   */
  immigrantPetition: YesNo;
  immigrantPetitionExplain?: string;
}

// ---------------------------------------------------------------------------
// 6. Address and Phone  (node=AddressPhone)
//    fixture: fixtures/address-phone.test.json
// ---------------------------------------------------------------------------

export interface AddressPhone {
  /** tbxAPP_ADDR_LN1 */
  street: string;
  street2?: string;
  /** tbxAPP_ADDR_CITY */
  city: string;
  /** tbxAPP_ADDR_STATE — or DNA via stateDoesNotApply */
  state?: string;
  stateDoesNotApply?: boolean;
  /** tbxAPP_ADDR_POSTAL_CD — or DNA */
  postalCode?: string;
  postalCodeDoesNotApply?: boolean;
  /** ddlCountry */
  country: CountryCode;
  /** rblMailingAddrSame — NO → mailing block */
  mailingSameAsHome: YesNo;
  mailingAddress?: {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    stateDoesNotApply?: boolean;
    postalCode?: string;
    postalCodeDoesNotApply?: boolean;
    country: CountryCode;
  };
  /** tbxAPP_HOME_TEL */
  primaryPhone: string;
  /** Mutually exclusive with workPhone */
  workPhoneDoesNotApply?: boolean;
  workPhone?: string;
  /** Mutually exclusive with secondaryPhone (mobile) */
  secondaryPhoneDoesNotApply?: boolean;
  secondaryPhone?: string;
  /** tbxAPP_EMAIL_ADDR */
  email: string;
  /** rblAddPhone */
  additionalPhone: YesNo;
  additionalPhones?: string[];
  /** rblAddEmail */
  additionalEmail: YesNo;
  additionalEmails?: string[];
  /** rblAddSocial */
  socialMedia: YesNo;
  /** ddlSocialMedia — use NONE when no accounts; never SONE */
  socialMediaPlatform?: SocialMediaPlatform;
  socialMediaIdentifier?: string;
  socialMediaAccounts?: Array<{
    platform: SocialMediaPlatform;
    identifier: string;
  }>;
}

// ---------------------------------------------------------------------------
// 7. Passport / Travel Document  (node=PptVisa)
//    fixture: fixtures/passport.test.json
// ---------------------------------------------------------------------------

export interface Passport {
  /** ddlPPT_TYPE */
  passportType: PassportType;
  /** tbxPPT_NUM — also used on Sign page */
  passportNumber: string;
  bookNumberDoesNotApply?: boolean;
  bookNumber?: string;
  /** ddlPPT_ISSUED_CNTRY */
  issuedCountry: CountryCode;
  /** tbxPPT_ISSUED_IN_CITY */
  issuedCity: string;
  /** tbxPPT_ISSUED_IN_STATE */
  issuedState: string;
  /** ddlPPT_ISSUED_IN_CNTRY */
  issuedInCountry: CountryCode;
  /**
   * Issue / expire date parts.
   * Canonical wire month is MonthPad ("01"…"12"); worker also accepts MonthCode
   * labels via option matching. Prefer MonthPad in new payloads.
   */
  issuedDay: DayPad;
  issuedMonth: MonthPad | MonthCode;
  issuedYear: Year;
  expireDay: DayPad;
  expireMonth: MonthPad | MonthCode;
  expireYear: Year;
  /** rblLOST_PPT_IND */
  lostStolen: YesNo;
  lostStolenDetails?: Array<{
    number?: string;
    numberDoesNotApply?: boolean;
    country: CountryCode;
    explain: string;
  }>;
}

// ---------------------------------------------------------------------------
// 8. U.S. Point of Contact  (node=USContact)
//    fixture: fixtures/us-contact.test.json
// ---------------------------------------------------------------------------

export interface UsContact {
  /** tbxUS_POC_SURNAME — or nameDoesNotApply */
  surname?: string;
  /** tbxUS_POC_GIVEN_NAME */
  givenNames?: string;
  nameDoesNotApply?: boolean;
  /** tbxUS_POC_ORGANIZATION — or organizationDoesNotApply */
  organization?: string;
  organizationDoesNotApply?: boolean;
  /** ddlUS_POC_REL_TO_APP — Friend wire is C */
  relationship: UsContactRelationship;
  street: string;
  street2?: string;
  city: string;
  /** ddlUS_POC_ADDR_STATE */
  state: UsStateCode;
  postalCode: string;
  phone: string;
  email?: string;
  emailDoesNotApply?: boolean;
}

// ---------------------------------------------------------------------------
// 9. Family Information: Relatives  (node=Relatives)
//    fixture: fixtures/family.test.json
//    Note: Spouse / previous-spouse pages appear for non-SINGLE marital status
//    and are not covered by the current worker path.
// ---------------------------------------------------------------------------

export interface Family {
  fatherSurname?: string;
  fatherSurnameUnknown?: boolean;
  fatherGivenNames?: string;
  fatherGivenNamesUnknown?: boolean;
  fatherDobDay?: DayPad;
  fatherDobMonth?: MonthCode;
  fatherDobYear?: Year;
  fatherDobUnknown?: boolean;
  /** rblFATHER_LIVE_IN_US_IND */
  fatherLiveInUs: YesNo;
  fatherUsStatus?: string;

  motherSurname?: string;
  motherSurnameUnknown?: boolean;
  motherGivenNames?: string;
  motherGivenNamesUnknown?: boolean;
  motherDobDay?: DayPad;
  motherDobMonth?: MonthCode;
  motherDobYear?: Year;
  motherDobUnknown?: boolean;
  motherLiveInUs: YesNo;
  motherUsStatus?: string;

  /** rblUS_IMMED_RELATIVE_IND */
  immediateUsRelative: YesNo;
  immediateRelatives?: Array<{
    surname: string;
    givenNames: string;
    relationship: string;
    status: string;
  }>;
  /** rblUS_OTHER_RELATIVE_IND */
  otherUsRelative: YesNo;
}

// ---------------------------------------------------------------------------
// 10. Present Work/Education  (node=WorkEducation1)
//     fixture: fixtures/work-education.test.json
// ---------------------------------------------------------------------------

export interface WorkEducation {
  /** ddlPresentOccupation (full postback) */
  occupation: Occupation;
  /**
   * tbxExplainOtherPresentOccupation (and fallbacks) — required for N / O / RT
   * and similar non-employer occupations.
   */
  notEmployedExplain?: string;
  /** Employer / school block when occupation is employed/student */
  employerName?: string;
  employerStreet?: string;
  employerCity?: string;
  employerState?: string;
  employerStateDoesNotApply?: boolean;
  employerPostalCode?: string;
  employerPostalCodeDoesNotApply?: boolean;
  employerCountry?: CountryCode;
  employerPhone?: string;
  jobTitle?: string;
  startDate?: DatePartsMonthCode;
  monthlyIncome?: string;
  duties?: string;
  /**
   * Sometimes still present on page 1 depending on CEAC state;
   * usually answered on WorkEducation2.
   */
  previouslyEmployed?: YesNo;
  otherEducation?: YesNo;
}

// ---------------------------------------------------------------------------
// 11. Previous Work/Education  (node=WorkEducation2)
//     fixture: fixtures/work-education-2.test.json
// ---------------------------------------------------------------------------

export interface PreviousEmployer {
  name: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: CountryCode;
  phone?: string;
  jobTitle?: string;
  supervisorSurname?: string;
  supervisorGivenNames?: string;
  startDate?: DatePartsMonthCode;
  endDate?: DatePartsMonthCode;
  duties?: string;
}

export interface PreviousSchool {
  name: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: CountryCode;
  courseOfStudy?: string;
  startDate?: DatePartsMonthCode;
  endDate?: DatePartsMonthCode;
}

export interface PreviousWorkEducation {
  /** rblPreviouslyEmployed */
  previouslyEmployed: YesNo;
  employers?: PreviousEmployer[];
  /** rblOtherEduc */
  otherEducation: YesNo;
  schools?: PreviousSchool[];
}

// ---------------------------------------------------------------------------
// 12. Additional Work/Education  (node=WorkEducation3)
//     fixture: fixtures/work-education-3.test.json
// ---------------------------------------------------------------------------

export interface AdditionalWorkEducation {
  /** rblCLAN_TRIBE_IND */
  clanOrTribe: YesNo;
  clanOrTribeName?: string;
  /** dtlLANGUAGES_ctl00_tbxLANGUAGE_NAME (+ add row). Worker fills languages[0] only today. */
  languages: string[];
  /** rblCOUNTRIES_VISITED_IND */
  countriesVisited: YesNo;
  countriesVisitedList?: CountryCode[];
  /** rblORGANIZATION_IND */
  organization: YesNo;
  organizations?: string[];
  /** rblSPECIALIZED_SKILLS_IND */
  specializedSkills: YesNo;
  specializedSkillsExplain?: string;
  /** rblMILITARY_SERVICE_IND */
  militaryService: YesNo;
  militaryServiceDetails?: Array<{
    country: CountryCode;
    branch: string;
    rank: string;
    specialty: string;
    startDate: DatePartsMonthCode;
    endDate: DatePartsMonthCode;
  }>;
  /** rblINSURGENT_ORG_IND */
  insurgentOrg: YesNo;
  insurgentOrgExplain?: string;
}

// ---------------------------------------------------------------------------
// 13. Security and Background  (nodes=SecurityandBackground1–5)
//     fixture: fixtures/security-background.test.json (generic mostly-NO)
//
// Named questions are the FE/BE contract. Worker may still use the generic
// answerRemainingYesNo / defaultYesNo escape hatch.
// ---------------------------------------------------------------------------

export interface SecurityBackgroundPart1 {
  /** rblDisease */
  disease: YesNoExplain;
  /** rblDisorder */
  disorder: YesNoExplain;
  /** rblDruguser */
  drugUser: YesNoExplain;
}

export interface SecurityBackgroundPart2 {
  arrested: YesNoExplain;
  controlledSubstances: YesNoExplain;
  prostitution: YesNoExplain;
  moneyLaundering: YesNoExplain;
  humanTrafficking: YesNoExplain;
  assistedSevereTrafficking: YesNoExplain;
  humanTraffickingRelated: YesNoExplain;
}

export interface SecurityBackgroundPart3 {
  illegalActivity: YesNoExplain;
  terroristActivity: YesNoExplain;
  terroristSupport: YesNoExplain;
  terroristOrg: YesNoExplain;
  terroristRel: YesNoExplain;
  genocide: YesNoExplain;
  torture: YesNoExplain;
  exViolence: YesNoExplain;
  childSoldier: YesNoExplain;
  religiousFreedom: YesNoExplain;
  populationControls: YesNoExplain;
  transplant: YesNoExplain;
}

export interface SecurityBackgroundPart4 {
  immigrationFraud: YesNoExplain;
  deport: YesNoExplain;
}

export interface SecurityBackgroundPart5 {
  childCustody: YesNoExplain;
  votingViolation: YesNoExplain;
  renounceExp: YesNoExplain;
}

/**
 * Preferred structured security answers (parts 1–5).
 * Also accepts the worker's generic mostly-NO fixture shape.
 */
export interface SecurityBackground {
  part1?: SecurityBackgroundPart1;
  part2?: SecurityBackgroundPart2;
  part3?: SecurityBackgroundPart3;
  part4?: SecurityBackgroundPart4;
  part5?: SecurityBackgroundPart5;

  /**
   * Worker escape hatch (fixtures/security-background.test.json):
   * answer every remaining visible YES/NO radio with defaultYesNo.
   */
  answerRemainingYesNo?: boolean;
  defaultYesNo?: YesNo;
  /** Sparse overrides keyed by CEAC partial control id */
  radios?: Record<string, YesNo>;
  texts?: Record<string, string>;
  selects?: Record<string, string>;
  checkboxes?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// 14. Sign and Submit  (node=SignCertify)
//     fixture: fixtures/sign-submit.test.json
//     CAPTCHA is runtime-only (data/captcha.txt), not part of stored applicant data.
// ---------------------------------------------------------------------------

export interface SignSubmit {
  /** rblPREP_IND */
  assistedByPreparer: YesNo;
  /**
   * PPTNumTbx — null/omit → worker copies passport.passportNumber
   */
  passportNumber?: string | null;
  /** Preparer branch — map of CEAC partial ids → values after probing YES */
  preparer?: {
    texts?: Record<string, string>;
    selects?: Record<string, string>;
    radios?: Record<string, YesNo>;
  };
}

// ---------------------------------------------------------------------------
// 15. Confirmation  (node=Done) — worker OUTPUT, not applicant input
// ---------------------------------------------------------------------------

export interface ConfirmationResult {
  url: string;
  title: string;
  node: string;
  applicationId: string;
  hasBarcode: boolean;
  barcodeImageSrc: string | null;
  printAvailable: boolean;
  emailAvailable: boolean;
  familyGroupAvailable: boolean;
  snippet: string;
  pdfPath?: string;
  screenshotPath?: string;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Root aggregate — single payload for FE ↔ BE ↔ worker
// ---------------------------------------------------------------------------

/**
 * Full DS-160 application payload.
 * Keys align with CEAC pages and with fill* functions in src/index.js.
 */
export interface Ds160Application {
  meta: Ds160Meta;
  personalInformation1: PersonalInformation1;
  personalInformation2: PersonalInformation2;
  travelInformation: TravelInformation;
  travelCompanions: TravelCompanions;
  previousUsTravel: PreviousUsTravel;
  addressPhone: AddressPhone;
  passport: Passport;
  usContact: UsContact;
  family: Family;
  workEducation: WorkEducation;
  previousWorkEducation: PreviousWorkEducation;
  additionalWorkEducation: AdditionalWorkEducation;
  securityBackground: SecurityBackground;
  signSubmit: SignSubmit;
}

/**
 * Maps root section keys → existing per-page fixture filenames.
 * Worker can accept either a monolithic Ds160Application or these files.
 */
export const DS160_SECTION_FIXTURES = {
  personalInformation1: "fixtures/personal-information-1.test.json",
  personalInformation2: "fixtures/personal-information-2.test.json",
  travelInformation: "fixtures/travel-information.test.json",
  travelCompanions: "fixtures/travel-companions.test.json",
  previousUsTravel: "fixtures/previous-us-travel.test.json",
  addressPhone: "fixtures/address-phone.test.json",
  passport: "fixtures/passport.test.json",
  usContact: "fixtures/us-contact.test.json",
  family: "fixtures/family.test.json",
  workEducation: "fixtures/work-education.test.json",
  previousWorkEducation: "fixtures/work-education-2.test.json",
  additionalWorkEducation: "fixtures/work-education-3.test.json",
  securityBackground: "fixtures/security-background.test.json",
  signSubmit: "fixtures/sign-submit.test.json",
} as const;

export type Ds160SectionKey = keyof typeof DS160_SECTION_FIXTURES;

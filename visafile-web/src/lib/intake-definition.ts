export type Answer = string | boolean | string[];
export type Answers = Record<string, Answer>;

export interface Option {
  value: string;
  label: string;
}
export interface Condition {
  field: string;
  equals: Answer;
}
export interface FieldDefinition {
  id: string;
  label: string;
  kind:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "yesno"
    | "textarea"
    | "checkbox"
    | "list";
  required?: boolean;
  helper?: string;
  placeholder?: string;
  options?: Option[];
  when?: Condition;
  width?: "half" | "full";
  sensitive?: boolean;
}
export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDefinition[];
}
export interface IntakeStage {
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  time: string;
  groups: FieldGroup[];
}

const yesNo = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({
  id,
  label,
  kind: "yesno",
  required: true,
  width: "full",
  ...extras,
});
const text = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "text", required: true, ...extras });
const optionalText = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "text", ...extras });
const date = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "date", required: true, ...extras });
const select = (
  id: string,
  label: string,
  options: Option[],
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({
  id,
  label,
  kind: "select",
  options,
  required: true,
  ...extras,
});

export const countries: Option[] = [
  ["IND", "India"],
  ["USA", "United States"],
  ["GBR", "United Kingdom"],
  ["CAN", "Canada"],
  ["AUS", "Australia"],
  ["ARE", "United Arab Emirates"],
  ["SGP", "Singapore"],
  ["CHN", "China"],
  ["JPN", "Japan"],
  ["DEU", "Germany"],
  ["FRA", "France"],
  ["BRA", "Brazil"],
  ["MEX", "Mexico"],
  ["ZAF", "South Africa"],
  ["OTHER", "Another country / region"],
].map(([value, label]) => ({ value, label }));

const usStates: Option[] = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["IL", "Illinois"],
  ["MA", "Massachusetts"],
  ["MD", "Maryland"],
  ["NJ", "New Jersey"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["OH", "Ohio"],
  ["PA", "Pennsylvania"],
  ["TX", "Texas"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["OTHER", "Another state"],
].map(([value, label]) => ({ value, label }));

const occupations: Option[] = [
  ["A", "Agriculture"],
  ["AP", "Artist / performer"],
  ["B", "Business"],
  ["CM", "Communications"],
  ["CS", "Computer science"],
  ["C", "Culinary / food services"],
  ["ED", "Education"],
  ["EN", "Engineering"],
  ["G", "Government"],
  ["H", "Homemaker"],
  ["LP", "Legal profession"],
  ["MH", "Medical / health"],
  ["M", "Military"],
  ["NS", "Natural science"],
  ["N", "Not employed"],
  ["PS", "Physical sciences"],
  ["RV", "Religious vocation"],
  ["R", "Research"],
  ["RT", "Retired"],
  ["SS", "Social science"],
  ["S", "Student"],
  ["O", "Other"],
].map(([value, label]) => ({ value, label }));

const explainIfYes = (id: string, label: string): FieldDefinition[] => [
  yesNo(id, label, { sensitive: true }),
  {
    id: `${id}.explain`,
    label: "Please explain",
    kind: "textarea",
    required: true,
    width: "full",
    sensitive: true,
    when: { field: id, equals: "YES" },
    helper:
      "Include dates and relevant details. You can review this before anything moves forward.",
  },
];

export const stages: IntakeStage[] = [
  {
    id: "personal",
    shortTitle: "About you",
    title: "Let’s start with you",
    description:
      "Use your passport wherever the wording says to. Small differences in names and dates can cause delays later.",
    time: "3 min",
    groups: [
      {
        title: "Application setup",
        description:
          "The location where you plan to apply and a memorable answer used to resume the official form.",
        fields: [
          select(
            "meta.locationCode",
            "U.S. embassy or consulate",
            [
              { value: "HYD", label: "Hyderabad, India" },
              { value: "MUM", label: "Mumbai, India" },
              { value: "NWD", label: "New Delhi, India" },
              { value: "CHN", label: "Chennai, India" },
              { value: "CLT", label: "Kolkata, India" },
              { value: "OTHER", label: "Another location" },
            ],
            {
              helper:
                "Choose the location where you expect to attend your visa interview.",
            },
          ),
          text("meta.securityAnswer", "Security question answer", {
            helper:
              "Use something memorable. You may need this answer later if you return to the official form.",
            sensitive: true,
          }),
          optionalText("meta.applicationId", "Existing DS-160 application ID", {
            helper:
              "Leave blank if you have not started an application on CEAC.",
          }),
        ],
      },
      {
        title: "Name and identity",
        fields: [
          text("personalInformation1.surname", "Surname / family name", {
            helper: "Exactly as shown in your passport.",
          }),
          text("personalInformation1.givenNames", "Given names", {
            helper:
              "Include first and middle names. If your passport has none, enter FNU.",
          }),
          yesNo(
            "personalInformation1.nativeNameApplies",
            "Is your full name written in another alphabet?",
          ),
          text(
            "personalInformation1.fullNameNativeAlphabet",
            "Full name in native alphabet",
            {
              when: {
                field: "personalInformation1.nativeNameApplies",
                equals: "YES",
              },
              helper:
                "For example, Hindi, Telugu, Arabic, or another non-Latin script.",
            },
          ),
          yesNo(
            "personalInformation1.otherNamesUsed",
            "Have you ever used another name?",
            {
              helper:
                "Include maiden, religious, professional, or alias names.",
            },
          ),
          {
            id: "personalInformation1.otherNames",
            label: "Other names used",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "personalInformation1.otherNamesUsed",
              equals: "YES",
            },
            placeholder: "One full name per line",
          },
          yesNo(
            "personalInformation1.telecodeNameUsed",
            "Do you have a telecode for your name?",
            {
              helper:
                "A telecode is a four-digit code used for some non-Roman characters. Most applicants answer No.",
            },
          ),
          text("personalInformation1.telecodeSurname", "Telecode surname", {
            when: {
              field: "personalInformation1.telecodeNameUsed",
              equals: "YES",
            },
          }),
          text(
            "personalInformation1.telecodeGivenNames",
            "Telecode given names",
            {
              when: {
                field: "personalInformation1.telecodeNameUsed",
                equals: "YES",
              },
            },
          ),
          select("personalInformation1.sex", "Sex", [
            { value: "M", label: "Male" },
            { value: "F", label: "Female" },
          ]),
          select("personalInformation1.maritalStatus", "Marital status", [
            { value: "S", label: "Single" },
            { value: "M", label: "Married" },
            { value: "C", label: "Common law marriage" },
            { value: "P", label: "Civil union / domestic partnership" },
            { value: "W", label: "Widowed" },
            { value: "D", label: "Divorced" },
            { value: "L", label: "Legally separated" },
            { value: "O", label: "Other" },
          ]),
        ],
      },
      {
        title: "Birth details",
        fields: [
          date("personalInformation1.dateOfBirth", "Date of birth"),
          text("personalInformation1.cityOfBirth", "City of birth"),
          optionalText(
            "personalInformation1.stateProvinceOfBirth",
            "State / province of birth",
            { helper: "Leave blank only if this genuinely does not apply." },
          ),
          select(
            "personalInformation1.countryRegionOfBirth",
            "Country / region of birth",
            countries,
          ),
        ],
      },
    ],
  },
  {
    id: "identity",
    shortTitle: "Identity",
    title: "Nationality and passport",
    description:
      "Keep your passport nearby. Enter document numbers without spaces unless they appear that way on the document.",
    time: "3 min",
    groups: [
      {
        title: "Citizenship and national IDs",
        fields: [
          select("personalInformation2.nationality", "Nationality", countries),
          yesNo(
            "personalInformation2.hasOtherNationality",
            "Do you hold or have you held another nationality?",
          ),
          {
            id: "personalInformation2.otherNationalities",
            label: "Other nationalities and passport details",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "personalInformation2.hasOtherNationality",
              equals: "YES",
            },
            placeholder:
              "One per line, for example: Canada — passport AB123456",
          },
          yesNo(
            "personalInformation2.isPermanentResidentOfOtherCountry",
            "Are you a permanent resident of another country?",
          ),
          {
            id: "personalInformation2.permanentResidentCountries",
            label: "Permanent resident countries",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "personalInformation2.isPermanentResidentOfOtherCountry",
              equals: "YES",
            },
            placeholder: "One country per line",
          },
          yesNo(
            "personalInformation2.hasNationalId",
            "Do you have a national identification number?",
          ),
          text(
            "personalInformation2.nationalIdentificationNumber",
            "National identification number",
            {
              when: {
                field: "personalInformation2.hasNationalId",
                equals: "YES",
              },
              sensitive: true,
            },
          ),
          yesNo(
            "personalInformation2.hasSSN",
            "Do you have a U.S. Social Security Number?",
          ),
          text("personalInformation2.ssn", "U.S. Social Security Number", {
            when: { field: "personalInformation2.hasSSN", equals: "YES" },
            sensitive: true,
          }),
          yesNo(
            "personalInformation2.hasTaxpayerID",
            "Do you have a U.S. Taxpayer ID?",
          ),
          text("personalInformation2.taxpayerId", "U.S. Taxpayer ID", {
            when: {
              field: "personalInformation2.hasTaxpayerID",
              equals: "YES",
            },
            sensitive: true,
          }),
        ],
      },
      {
        title: "Passport",
        fields: [
          select("passport.passportType", "Passport type", [
            { value: "R", label: "Regular" },
            { value: "O", label: "Official" },
            { value: "D", label: "Diplomatic" },
            { value: "L", label: "Laissez-passer" },
            { value: "T", label: "Other" },
          ]),
          text("passport.passportNumber", "Passport number", {
            sensitive: true,
          }),
          optionalText("passport.bookNumber", "Passport book number", {
            helper:
              "This may be called an inventory control number. Leave blank if your passport does not have one.",
          }),
          select(
            "passport.issuedCountry",
            "Issuing country / authority",
            countries,
          ),
          text("passport.issuedCity", "City where issued"),
          optionalText("passport.issuedState", "State / province where issued"),
          select("passport.issuedInCountry", "Country where issued", countries),
          date("passport.issuedDate", "Issue date"),
          date("passport.expirationDate", "Expiration date"),
          yesNo(
            "passport.lostStolen",
            "Have you ever lost a passport or had one stolen?",
          ),
          {
            id: "passport.lostStolenDetails",
            label: "Lost or stolen passport details",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "passport.lostStolen", equals: "YES" },
            placeholder:
              "Number, country, and a short explanation — one passport per line",
          },
        ],
      },
    ],
  },
  {
    id: "travel",
    shortTitle: "Your trip",
    title: "Your planned U.S. trip",
    description:
      "Estimates are okay when your plans are not final. We’ll clearly distinguish plans from confirmed bookings.",
    time: "3 min",
    groups: [
      {
        title: "Purpose and timing",
        fields: [
          select("travelInformation.purposeOfTrip", "Purpose of trip", [
            { value: "B", label: "Business / tourism / medical (B)" },
            { value: "F", label: "Academic student (F)" },
            { value: "J", label: "Exchange visitor (J)" },
            { value: "H", label: "Temporary worker (H)" },
            { value: "L", label: "Intracompany transferee (L)" },
            { value: "K", label: "Fiancé(e) (K)" },
            { value: "M", label: "Vocational student (M)" },
            { value: "O", label: "Extraordinary ability (O)" },
            { value: "OTHER", label: "Another purpose" },
          ]),
          select("travelInformation.otherPurpose", "Visa class", [
            { value: "B1-B2", label: "Business and tourism (B1/B2)" },
            { value: "B1", label: "Business (B1)" },
            { value: "B2", label: "Tourism / medical (B2)" },
            { value: "OTHER", label: "Another visa class" },
          ]),
          yesNo(
            "travelInformation.hasSpecificTravelPlans",
            "Have you made specific travel plans?",
          ),
          date("travelInformation.arrivalDate", "Intended arrival date"),
          date("travelInformation.departureDate", "Intended departure date", {
            when: {
              field: "travelInformation.hasSpecificTravelPlans",
              equals: "YES",
            },
          }),
          text("travelInformation.arrivalFlight", "Arrival flight", {
            when: {
              field: "travelInformation.hasSpecificTravelPlans",
              equals: "YES",
            },
          }),
          text("travelInformation.arrivalCity", "Arrival city", {
            when: {
              field: "travelInformation.hasSpecificTravelPlans",
              equals: "YES",
            },
          }),
          text("travelInformation.departureFlight", "Departure flight", {
            when: {
              field: "travelInformation.hasSpecificTravelPlans",
              equals: "YES",
            },
          }),
          text("travelInformation.departureCity", "Departure city", {
            when: {
              field: "travelInformation.hasSpecificTravelPlans",
              equals: "YES",
            },
          }),
          text("travelInformation.lengthOfStay", "Intended length of stay", {
            placeholder: "For example, 14 days",
          }),
          {
            id: "travelInformation.locationsToVisit",
            label: "Places you plan to visit",
            kind: "list",
            width: "full",
            placeholder: "One city or location per line",
          },
        ],
      },
      {
        title: "Where you will stay",
        fields: [
          text("travelInformation.usAddress.street", "Street address"),
          optionalText("travelInformation.usAddress.street2", "Address line 2"),
          text("travelInformation.usAddress.city", "City"),
          select("travelInformation.usAddress.state", "State", usStates),
          optionalText("travelInformation.usAddress.zipCode", "ZIP code"),
        ],
      },
      {
        title: "Trip costs",
        fields: [
          select(
            "travelInformation.payingForTrip",
            "Who is paying for your trip?",
            [
              { value: "S", label: "Self" },
              { value: "O", label: "Other person" },
              { value: "P", label: "Present employer" },
              { value: "U", label: "U.S. employer" },
              { value: "C", label: "Other company / organization" },
            ],
          ),
          text("travelInformation.payer", "Payer name and contact details", {
            width: "full",
            when: { field: "travelInformation.payingForTrip", equals: "O" },
            helper: "Include the person’s relationship to you.",
          }),
        ],
      },
      {
        title: "Travel companions",
        fields: [
          yesNo(
            "travelCompanions.otherPersonsTravelingWithYou",
            "Is anyone traveling with you?",
          ),
          yesNo(
            "travelCompanions.travelingAsGroup",
            "Are you traveling as part of a group or organization?",
            {
              when: {
                field: "travelCompanions.otherPersonsTravelingWithYou",
                equals: "YES",
              },
            },
          ),
          text("travelCompanions.groupName", "Group name", {
            when: { field: "travelCompanions.travelingAsGroup", equals: "YES" },
          }),
          {
            id: "travelCompanions.companions",
            label: "Travel companions",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "travelCompanions.travelingAsGroup", equals: "NO" },
            placeholder: "Full name — relationship, one person per line",
          },
        ],
      },
    ],
  },
  {
    id: "history",
    shortTitle: "U.S. history",
    title: "Previous U.S. travel",
    description:
      "Past visits or visa issues do not automatically mean there is a problem. Answer accurately and add context when asked.",
    time: "3 min",
    groups: [
      {
        title: "Visits",
        fields: [
          yesNo(
            "previousUsTravel.beenToUs",
            "Have you ever been in the United States?",
          ),
          {
            id: "previousUsTravel.previousVisits",
            label: "Your five most recent U.S. visits",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "previousUsTravel.beenToUs", equals: "YES" },
            placeholder: "Arrival date — length of stay, one visit per line",
          },
          yesNo(
            "previousUsTravel.hasUsDriversLicense",
            "Have you ever held a U.S. driver’s license?",
            { when: { field: "previousUsTravel.beenToUs", equals: "YES" } },
          ),
          {
            id: "previousUsTravel.usDriversLicenses",
            label: "U.S. driver’s licenses",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "previousUsTravel.hasUsDriversLicense",
              equals: "YES",
            },
            placeholder: "License number — state, one per line",
          },
        ],
      },
      {
        title: "Visa history",
        fields: [
          yesNo(
            "previousUsTravel.visaIssued",
            "Have you ever been issued a U.S. visa?",
          ),
          {
            id: "previousUsTravel.lastVisa",
            label: "Most recent visa details",
            kind: "textarea",
            required: true,
            width: "full",
            when: { field: "previousUsTravel.visaIssued", equals: "YES" },
            placeholder: "Issue date, visa number, class, and place issued",
          },
          yesNo(
            "previousUsTravel.visaLostStolen",
            "Was that visa ever lost or stolen?",
            { when: { field: "previousUsTravel.visaIssued", equals: "YES" } },
          ),
          text("previousUsTravel.visaLostStolenExplain", "Please explain", {
            width: "full",
            when: { field: "previousUsTravel.visaLostStolen", equals: "YES" },
          }),
          yesNo(
            "previousUsTravel.visaCancelled",
            "Was that visa ever cancelled or revoked?",
            { when: { field: "previousUsTravel.visaIssued", equals: "YES" } },
          ),
          text("previousUsTravel.visaCancelledExplain", "Please explain", {
            width: "full",
            when: { field: "previousUsTravel.visaCancelled", equals: "YES" },
          }),
          yesNo(
            "previousUsTravel.visaRefused",
            "Have you ever been refused a U.S. visa, admission, or withdrawn an application at a port of entry?",
          ),
          text("previousUsTravel.visaRefusedExplain", "Please explain", {
            width: "full",
            when: { field: "previousUsTravel.visaRefused", equals: "YES" },
          }),
        ],
      },
      {
        title: "Immigration petition",
        fields: [
          yesNo(
            "previousUsTravel.immigrantPetition",
            "Has anyone ever filed an immigrant petition for you with U.S. Citizenship and Immigration Services?",
          ),
          text("previousUsTravel.immigrantPetitionExplain", "Please explain", {
            width: "full",
            when: {
              field: "previousUsTravel.immigrantPetition",
              equals: "YES",
            },
          }),
        ],
      },
    ],
  },
  {
    id: "contacts",
    shortTitle: "Contacts",
    title: "Addresses and contact details",
    description:
      "We’ll collect your current contact information and the person or organization you plan to contact in the U.S.",
    time: "4 min",
    groups: [
      {
        title: "Home address",
        fields: [
          text("addressPhone.street", "Street address"),
          optionalText("addressPhone.street2", "Address line 2"),
          text("addressPhone.city", "City"),
          optionalText("addressPhone.state", "State / province"),
          optionalText("addressPhone.postalCode", "Postal code"),
          select("addressPhone.country", "Country", countries),
          yesNo(
            "addressPhone.mailingSameAsHome",
            "Is your mailing address the same as your home address?",
          ),
          {
            id: "addressPhone.mailingAddress",
            label: "Mailing address",
            kind: "textarea",
            required: true,
            width: "full",
            when: { field: "addressPhone.mailingSameAsHome", equals: "NO" },
          },
        ],
      },
      {
        title: "Phone, email, and social media",
        fields: [
          {
            id: "addressPhone.primaryPhone",
            label: "Primary phone",
            kind: "tel",
            required: true,
            sensitive: true,
          },
          optionalText("addressPhone.secondaryPhone", "Secondary phone", {
            sensitive: true,
          }),
          optionalText("addressPhone.workPhone", "Work phone", {
            sensitive: true,
          }),
          {
            id: "addressPhone.email",
            label: "Email address",
            kind: "email",
            required: true,
            sensitive: true,
          },
          yesNo(
            "addressPhone.additionalPhone",
            "Have you used other phone numbers in the last five years?",
          ),
          {
            id: "addressPhone.additionalPhones",
            label: "Additional phone numbers",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "addressPhone.additionalPhone", equals: "YES" },
          },
          yesNo(
            "addressPhone.additionalEmail",
            "Have you used other email addresses in the last five years?",
          ),
          {
            id: "addressPhone.additionalEmails",
            label: "Additional email addresses",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "addressPhone.additionalEmail", equals: "YES" },
          },
          yesNo(
            "addressPhone.socialMedia",
            "Have you used social media in the last five years?",
          ),
          {
            id: "addressPhone.socialMediaAccounts",
            label: "Social media platforms and identifiers",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "addressPhone.socialMedia", equals: "YES" },
            placeholder: "Platform — username or identifier, one per line",
            helper: "Do not enter passwords.",
          },
        ],
      },
      {
        title: "U.S. contact",
        description:
          "This can be a person, hotel, school, employer, or other organization that knows about your trip.",
        fields: [
          yesNo(
            "usContact.nameDoesNotApply",
            "Are you using an organization instead of a named person?",
          ),
          text("usContact.surname", "Contact surname", {
            when: { field: "usContact.nameDoesNotApply", equals: "NO" },
          }),
          text("usContact.givenNames", "Contact given names", {
            when: { field: "usContact.nameDoesNotApply", equals: "NO" },
          }),
          optionalText("usContact.organization", "Organization name"),
          select("usContact.relationship", "Relationship to you", [
            { value: "R", label: "Relative" },
            { value: "S", label: "Spouse" },
            { value: "C", label: "Friend" },
            { value: "B", label: "Business associate" },
            { value: "P", label: "Employer" },
            { value: "H", label: "School official" },
            { value: "O", label: "Other" },
          ]),
          text("usContact.street", "Street address"),
          optionalText("usContact.street2", "Address line 2"),
          text("usContact.city", "City"),
          select("usContact.state", "State", usStates),
          text("usContact.postalCode", "ZIP code"),
          {
            id: "usContact.phone",
            label: "Phone",
            kind: "tel",
            required: true,
          },
          optionalText("usContact.email", "Email address", { kind: "email" }),
        ],
      },
    ],
  },
  {
    id: "family",
    shortTitle: "Family",
    title: "Your family",
    description:
      "The official form asks about parents and relatives in the U.S., even if they are not part of your trip.",
    time: "3 min",
    groups: [
      {
        title: "Father",
        fields: [
          yesNo("family.fatherNameKnown", "Do you know your father’s name?"),
          text("family.fatherSurname", "Father’s surname", {
            when: { field: "family.fatherNameKnown", equals: "YES" },
          }),
          text("family.fatherGivenNames", "Father’s given names", {
            when: { field: "family.fatherNameKnown", equals: "YES" },
          }),
          yesNo(
            "family.fatherDobKnown",
            "Do you know your father’s date of birth?",
          ),
          date("family.fatherDateOfBirth", "Father’s date of birth", {
            when: { field: "family.fatherDobKnown", equals: "YES" },
          }),
          yesNo("family.fatherLiveInUs", "Does your father live in the U.S.?"),
          select(
            "family.fatherUsStatus",
            "Father’s U.S. status",
            [
              { value: "C", label: "U.S. citizen" },
              { value: "L", label: "U.S. lawful permanent resident" },
              { value: "N", label: "Nonimmigrant" },
              { value: "O", label: "Other / unknown" },
            ],
            { when: { field: "family.fatherLiveInUs", equals: "YES" } },
          ),
        ],
      },
      {
        title: "Mother",
        fields: [
          yesNo("family.motherNameKnown", "Do you know your mother’s name?"),
          text("family.motherSurname", "Mother’s surname", {
            when: { field: "family.motherNameKnown", equals: "YES" },
          }),
          text("family.motherGivenNames", "Mother’s given names", {
            when: { field: "family.motherNameKnown", equals: "YES" },
          }),
          yesNo(
            "family.motherDobKnown",
            "Do you know your mother’s date of birth?",
          ),
          date("family.motherDateOfBirth", "Mother’s date of birth", {
            when: { field: "family.motherDobKnown", equals: "YES" },
          }),
          yesNo("family.motherLiveInUs", "Does your mother live in the U.S.?"),
          select(
            "family.motherUsStatus",
            "Mother’s U.S. status",
            [
              { value: "C", label: "U.S. citizen" },
              { value: "L", label: "U.S. lawful permanent resident" },
              { value: "N", label: "Nonimmigrant" },
              { value: "O", label: "Other / unknown" },
            ],
            { when: { field: "family.motherLiveInUs", equals: "YES" } },
          ),
        ],
      },
      {
        title: "Other relatives",
        fields: [
          yesNo(
            "family.immediateUsRelative",
            "Do you have immediate relatives in the U.S.?",
            {
              helper:
                "Immediate relatives include a spouse, fiancé(e), child, or sibling.",
            },
          ),
          {
            id: "family.immediateRelatives",
            label: "Immediate relatives in the U.S.",
            kind: "list",
            required: true,
            width: "full",
            when: { field: "family.immediateUsRelative", equals: "YES" },
            placeholder:
              "Full name — relationship — U.S. status, one person per line",
          },
          yesNo(
            "family.otherUsRelative",
            "Do you have any other relatives in the U.S.?",
          ),
        ],
      },
    ],
  },
  {
    id: "work",
    shortTitle: "Work & study",
    title: "Work, education, and experience",
    description:
      "Tell us what you do now, then add the history and experience requested by the official form.",
    time: "5 min",
    groups: [
      {
        title: "Current work or study",
        fields: [
          select("workEducation.occupation", "Present occupation", occupations),
          text(
            "workEducation.notEmployedExplain",
            "Explain your current situation",
            {
              width: "full",
              when: { field: "workEducation.occupation", equals: "N" },
            },
          ),
          text("workEducation.employerName", "Employer or school name"),
          text("workEducation.jobTitle", "Job title or course of study"),
          text("workEducation.employerStreet", "Street address"),
          text("workEducation.employerCity", "City"),
          optionalText("workEducation.employerState", "State / province"),
          optionalText("workEducation.employerPostalCode", "Postal code"),
          select("workEducation.employerCountry", "Country", countries),
          {
            id: "workEducation.employerPhone",
            label: "Work or school phone",
            kind: "tel",
            required: true,
          },
          date("workEducation.startDate", "Start date"),
          optionalText(
            "workEducation.monthlyIncome",
            "Monthly income in local currency",
          ),
          {
            id: "workEducation.duties",
            label: "Briefly describe your duties",
            kind: "textarea",
            required: true,
            width: "full",
          },
        ],
      },
      {
        title: "Previous employment and education",
        fields: [
          yesNo(
            "previousWorkEducation.previouslyEmployed",
            "Were you previously employed?",
          ),
          {
            id: "previousWorkEducation.employers",
            label: "Previous employers from the last five years",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "previousWorkEducation.previouslyEmployed",
              equals: "YES",
            },
            placeholder:
              "Employer — title — address — start/end dates — duties, one per line",
          },
          yesNo(
            "previousWorkEducation.otherEducation",
            "Have you attended educational institutions beyond primary school?",
          ),
          {
            id: "previousWorkEducation.schools",
            label: "Schools attended",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "previousWorkEducation.otherEducation",
              equals: "YES",
            },
            placeholder:
              "School — address — course — start/end dates, one per line",
          },
        ],
      },
      {
        title: "Additional background",
        fields: [
          yesNo(
            "additionalWorkEducation.clanOrTribe",
            "Do you belong to a clan or tribe?",
          ),
          text(
            "additionalWorkEducation.clanOrTribeName",
            "Clan or tribe name",
            {
              when: {
                field: "additionalWorkEducation.clanOrTribe",
                equals: "YES",
              },
            },
          ),
          {
            id: "additionalWorkEducation.languages",
            label: "Languages you speak",
            kind: "list",
            required: true,
            width: "full",
            placeholder: "One language per line",
          },
          yesNo(
            "additionalWorkEducation.countriesVisited",
            "Have you traveled to any countries in the last five years?",
          ),
          {
            id: "additionalWorkEducation.countriesVisitedList",
            label: "Countries visited",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "additionalWorkEducation.countriesVisited",
              equals: "YES",
            },
          },
          yesNo(
            "additionalWorkEducation.organization",
            "Have you belonged to, contributed to, or worked for any professional, social, or charitable organization?",
          ),
          {
            id: "additionalWorkEducation.organizations",
            label: "Organizations",
            kind: "list",
            required: true,
            width: "full",
            when: {
              field: "additionalWorkEducation.organization",
              equals: "YES",
            },
          },
          yesNo(
            "additionalWorkEducation.specializedSkills",
            "Do you have specialized skills or training involving firearms, explosives, nuclear, biological, or chemical experience?",
          ),
          text(
            "additionalWorkEducation.specializedSkillsExplain",
            "Please explain",
            {
              width: "full",
              when: {
                field: "additionalWorkEducation.specializedSkills",
                equals: "YES",
              },
            },
          ),
          yesNo(
            "additionalWorkEducation.militaryService",
            "Have you ever served in the military?",
          ),
          {
            id: "additionalWorkEducation.militaryServiceDetails",
            label: "Military service details",
            kind: "textarea",
            required: true,
            width: "full",
            when: {
              field: "additionalWorkEducation.militaryService",
              equals: "YES",
            },
            placeholder: "Country, branch, rank, specialty, and dates",
          },
          yesNo(
            "additionalWorkEducation.insurgentOrg",
            "Have you ever served in or been involved with a paramilitary, vigilante, rebel, guerrilla, or insurgent organization?",
          ),
          text(
            "additionalWorkEducation.insurgentOrgExplain",
            "Please explain",
            {
              width: "full",
              when: {
                field: "additionalWorkEducation.insurgentOrg",
                equals: "YES",
              },
            },
          ),
        ],
      },
    ],
  },
  {
    id: "security",
    shortTitle: "Security",
    title: "Security and background",
    description:
      "These are official DS-160 topics. Read each one carefully. A Yes answer does not make a decision here—we only collect your explanation for review.",
    time: "6 min",
    groups: [
      {
        title: "Health",
        fields: [
          ...explainIfYes(
            "security.part1.disease",
            "Do you have a communicable disease of public health significance?",
          ),
          ...explainIfYes(
            "security.part1.disorder",
            "Do you have a mental or physical disorder that poses or is likely to pose a threat to safety or welfare?",
          ),
          ...explainIfYes(
            "security.part1.drugUser",
            "Are you or have you ever been a drug abuser or addict?",
          ),
        ],
      },
      {
        title: "Criminal activity",
        fields: [
          ...explainIfYes(
            "security.part2.arrested",
            "Have you ever been arrested or convicted for any offense or crime?",
          ),
          ...explainIfYes(
            "security.part2.controlledSubstances",
            "Have you ever violated a law relating to controlled substances?",
          ),
          ...explainIfYes(
            "security.part2.prostitution",
            "Are you coming to engage in prostitution or have you engaged in prostitution in the past ten years?",
          ),
          ...explainIfYes(
            "security.part2.moneyLaundering",
            "Have you ever been involved in money laundering?",
          ),
          ...explainIfYes(
            "security.part2.humanTrafficking",
            "Have you ever committed or conspired to commit a human trafficking offense?",
          ),
          ...explainIfYes(
            "security.part2.humanTraffickingRelated",
            "Have you knowingly benefited from human trafficking activities?",
          ),
          ...explainIfYes(
            "security.part2.assistedSevereTrafficking",
            "Have you knowingly assisted or colluded with a person involved in severe human trafficking?",
          ),
        ],
      },
      {
        title: "Security and human rights",
        fields: [
          ...explainIfYes(
            "security.part3.illegalActivity",
            "Do you seek to engage in espionage, sabotage, export-control violations, or other illegal activity in the U.S.?",
          ),
          ...explainIfYes(
            "security.part3.terroristActivity",
            "Have you ever engaged in terrorist activities?",
          ),
          ...explainIfYes(
            "security.part3.terroristSupport",
            "Have you ever provided financial or other support to terrorists or terrorist organizations?",
          ),
          ...explainIfYes(
            "security.part3.terroristOrg",
            "Are you a member or representative of a terrorist organization?",
          ),
          ...explainIfYes(
            "security.part3.terroristRel",
            "Are you the spouse or child of someone involved in terrorist activity within the relevant period?",
          ),
          ...explainIfYes(
            "security.part3.genocide",
            "Have you ever ordered, incited, committed, assisted, or otherwise participated in genocide?",
          ),
          ...explainIfYes(
            "security.part3.torture",
            "Have you ever committed, ordered, assisted, or participated in torture?",
          ),
          ...explainIfYes(
            "security.part3.exViolence",
            "Have you ever committed or participated in extrajudicial killing, political killing, or other violence?",
          ),
          ...explainIfYes(
            "security.part3.childSoldier",
            "Have you ever recruited or used child soldiers?",
          ),
          ...explainIfYes(
            "security.part3.religiousFreedom",
            "Have you been responsible for severe violations of religious freedom as a government official?",
          ),
          ...explainIfYes(
            "security.part3.populationControls",
            "Have you been involved in coercive population-control procedures?",
          ),
          ...explainIfYes(
            "security.part3.transplant",
            "Have you been involved in coercive transplantation of human organs or tissue?",
          ),
        ],
      },
      {
        title: "Immigration law",
        fields: [
          ...explainIfYes(
            "security.part4.immigrationFraud",
            "Have you ever sought or helped someone obtain a U.S. visa or immigration benefit through fraud or misrepresentation?",
          ),
          ...explainIfYes(
            "security.part4.deport",
            "Have you ever been removed or deported from any country?",
          ),
        ],
      },
      {
        title: "Other legal matters",
        fields: [
          ...explainIfYes(
            "security.part5.childCustody",
            "Have you withheld custody of a U.S. citizen child outside the U.S. from a person granted legal custody?",
          ),
          ...explainIfYes(
            "security.part5.votingViolation",
            "Have you voted in the U.S. in violation of law or regulation?",
          ),
          ...explainIfYes(
            "security.part5.renounceExp",
            "Have you renounced U.S. citizenship to avoid taxation?",
          ),
        ],
      },
    ],
  },
  {
    id: "review",
    shortTitle: "Review",
    title: "Review your answers",
    description:
      "Nothing is submitted. Check each section and edit anything that does not look right.",
    time: "2 min",
    groups: [],
  },
];

export const allFields = stages.flatMap((stage) =>
  stage.groups.flatMap((group) => group.fields),
);
export const fieldById = new Map(allFields.map((field) => [field.id, field]));

export function isFieldVisible(field: FieldDefinition, answers: Answers) {
  if (!field.when) return true;
  return answers[field.when.field] === field.when.equals;
}

export function labelForAnswer(
  field: FieldDefinition,
  answer: Answer | undefined,
) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer === true) return "Yes";
  if (answer === false) return "No";
  if (!answer) return "Not answered";
  return (
    field.options?.find((option) => option.value === answer)?.label ??
    String(answer)
  );
}

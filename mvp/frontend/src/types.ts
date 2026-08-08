export type YesNo = "YES" | "NO";

export type JobStatus =
  | "queued"
  | "filling"
  | "awaiting_captcha"
  | "awaiting_correction"
  | "submitting"
  | "completed"
  | "failed";

export interface ValidationErrorItem {
  message: string;
  field?: string;
  kind?: "text" | "select" | "radio" | "checkbox";
  schemaPath?: string;
}

export interface FieldCorrection {
  target: string;
  value: string;
  kind?: "text" | "select" | "radio" | "checkbox";
  partialId?: boolean;
}

export type JobWsMessage =
  | { type: "status"; status: JobStatus; detail?: string }
  | { type: "captcha-needed"; imageBase64: string }
  | { type: "captcha-answer"; answer: string }
  | { type: "correction-needed"; errors: ValidationErrorItem[] }
  | { type: "correction-answer"; corrections: FieldCorrection[] }
  | { type: "completed"; pdfPath: string; downloadUrl: string }
  | { type: "failed"; error: string };

/** Mirrors shared Ds160Application (wire values). */
export interface Ds160Application {
  meta: {
    locationCode: string;
    securityAnswer: string;
    applicationId?: string;
    allowSubmit?: boolean;
  };
  personalInformation1: Record<string, unknown>;
  personalInformation2: Record<string, unknown>;
  travelInformation: Record<string, unknown>;
  travelCompanions: Record<string, unknown>;
  previousUsTravel: Record<string, unknown>;
  addressPhone: Record<string, unknown>;
  passport: Record<string, unknown>;
  usContact: Record<string, unknown>;
  family: Record<string, unknown>;
  workEducation: Record<string, unknown>;
  previousWorkEducation: Record<string, unknown>;
  additionalWorkEducation: Record<string, unknown>;
  securityBackground: Record<string, unknown>;
  signSubmit: Record<string, unknown>;
}

export const STEPS = [
  { key: "meta", title: "Session / Meta" },
  { key: "personalInformation1", title: "Personal Information 1" },
  { key: "personalInformation2", title: "Personal Information 2" },
  { key: "travelInformation", title: "Travel Information" },
  { key: "travelCompanions", title: "Travel Companions" },
  { key: "previousUsTravel", title: "Previous U.S. Travel" },
  { key: "addressPhone", title: "Address & Phone" },
  { key: "passport", title: "Passport" },
  { key: "usContact", title: "U.S. Contact" },
  { key: "family", title: "Family" },
  { key: "workEducation", title: "Work / Education" },
  { key: "previousWorkEducation", title: "Previous Work / Education" },
  { key: "additionalWorkEducation", title: "Additional Work / Education" },
  { key: "securityBackground", title: "Security & Background" },
  { key: "signSubmit", title: "Sign & Submit" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

import type { Metadata } from "next";
import { IntakeExperience } from "@/components/intake/intake-experience";

export const metadata: Metadata = { title: "DS-160 intake — VisaFile" };

export default function IntakePage() {
  return <IntakeExperience />;
}

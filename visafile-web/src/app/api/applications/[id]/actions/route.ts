import { NextResponse } from "next/server";
import {
  sendCaptchaAnswer,
  sendCorrections,
} from "@/lib/server/automation-api";
import { authenticatedSupabase } from "@/lib/server/authenticated-supabase";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticatedSupabase(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: intake } = await auth.client
    .from("ds160_intake_submissions")
    .select("automation_job_id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!intake?.automation_job_id) {
    return NextResponse.json(
      { error: "Automation job not found" },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { type: "captcha"; answer?: string }
    | { type: "corrections"; corrections?: Array<Record<string, unknown>> }
    | null;
  try {
    if (body?.type === "captcha" && body.answer) {
      await sendCaptchaAnswer(intake.automation_job_id, body.answer);
    } else if (body?.type === "corrections" && body.corrections?.length) {
      await sendCorrections(intake.automation_job_id, body.corrections);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 409 },
    );
  }
}

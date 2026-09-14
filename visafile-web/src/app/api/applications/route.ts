import { NextResponse } from "next/server";
import {
  intakeAnswersToDs160,
  IntakeMappingError,
} from "@/lib/automation/intake-to-ds160";
import { stages, type Answers } from "@/lib/intake-definition";
import { createAutomationJob } from "@/lib/server/automation-api";
import { authenticatedSupabase } from "@/lib/server/authenticated-supabase";

export const runtime = "nodejs";

function intakeSaveErrorMessage(code?: string) {
  if (code === "PGRST205") {
    return "This project is missing the intake table. Run visafile-web/supabase/schema.sql in the Supabase SQL editor, then try again.";
  }
  return "We couldn’t save this intake.";
}

export async function POST(request: Request) {
  const auth = await authenticatedSupabase(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { answers?: Answers; authorizeOfficialSubmission?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (
    !body.answers ||
    typeof body.answers !== "object" ||
    Array.isArray(body.answers)
  ) {
    return NextResponse.json(
      { error: "Answers are required" },
      { status: 400 },
    );
  }

  let application: Record<string, unknown>;
  try {
    application = intakeAnswersToDs160(body.answers, {
      authorizeOfficialSubmission: body.authorizeOfficialSubmission,
    });
  } catch (error) {
    const message =
      error instanceof IntakeMappingError
        ? error.message
        : "The intake could not be prepared.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data: intake, error: insertError } = await auth.client
    .from("ds160_intake_submissions")
    .insert({
      user_id: auth.user.id,
      answers: body.answers as Record<string, unknown>,
      step: stages.length - 1,
      progress: 100,
      source: "visafile-web",
      schema_version: 2,
      automation_status: "queueing",
      authorize_official_submission: Boolean(body.authorizeOfficialSubmission),
    })
    .select("id")
    .single();
  if (insertError || !intake) {
    console.error("ds160_intake_submissions insert failed", {
      code: insertError?.code,
      message: insertError?.message,
      details: insertError?.details,
      hint: insertError?.hint,
    });
    return NextResponse.json(
      { error: intakeSaveErrorMessage(insertError?.code) },
      { status: 500 },
    );
  }

  try {
    const jobId = await createAutomationJob(application);
    const { error: updateError } = await auth.client
      .from("ds160_intake_submissions")
      .update({ automation_status: "queued", automation_error: null })
      .eq("id", intake.id)
      .eq("user_id", auth.user.id);
    if (updateError) throw updateError;
    const { error: linkError } = await auth.client
      .from("ds160_intake_submissions")
      .update({ automation_job_id: jobId })
      .eq("id", intake.id)
      .eq("user_id", auth.user.id);
    if (linkError) throw linkError;
    return NextResponse.json(
      { applicationId: intake.id, status: "queued" },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Automation could not be started.";
    await auth.client
      .from("ds160_intake_submissions")
      .update({ automation_status: "failed", automation_error: message })
      .eq("id", intake.id)
      .eq("user_id", auth.user.id);
    return NextResponse.json(
      {
        error: `Your intake was saved, but automation did not start: ${message}`,
        applicationId: intake.id,
      },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAutomationStatus } from "@/lib/server/automation-api";
import { authenticatedSupabase } from "@/lib/server/authenticated-supabase";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticatedSupabase(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: intake, error } = await auth.client
    .from("ds160_intake_submissions")
    .select(
      "id, automation_job_id, automation_status, automation_error, authorize_official_submission, created_at",
    )
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error || !intake) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }
  if (!intake.automation_job_id) {
    return NextResponse.json({
      applicationId: intake.id,
      status: intake.automation_status,
      error: intake.automation_error,
      authorizeOfficialSubmission: intake.authorize_official_submission,
      createdAt: intake.created_at,
      pendingInteraction: null,
      hasPdf: false,
    });
  }

  try {
    const automation = await getAutomationStatus(intake.automation_job_id);
    if (
      automation.status !== intake.automation_status ||
      automation.error !== intake.automation_error
    ) {
      await auth.client
        .from("ds160_intake_submissions")
        .update({
          automation_status: automation.status,
          automation_error: automation.error,
        })
        .eq("id", intake.id)
        .eq("user_id", auth.user.id);
    }
    return NextResponse.json({
      applicationId: intake.id,
      status: automation.status,
      error: automation.error,
      authorizeOfficialSubmission: intake.authorize_official_submission,
      createdAt: intake.created_at,
      updatedAt: automation.updatedAt,
      pendingInteraction: automation.pendingInteraction,
      hasPdf: automation.status === "completed" && Boolean(automation.pdfPath),
    });
  } catch {
    return NextResponse.json(
      { error: "Automation status is temporarily unavailable." },
      { status: 503 },
    );
  }
}

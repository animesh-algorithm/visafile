import { NextResponse } from "next/server";
import { downloadAutomationPdf } from "@/lib/server/automation-api";
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
  const { data: intake } = await auth.client
    .from("ds160_intake_submissions")
    .select("automation_job_id, automation_status")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!intake?.automation_job_id || intake.automation_status !== "completed") {
    return NextResponse.json(
      { error: "Confirmation PDF is not available" },
      { status: 409 },
    );
  }
  const upstream = await downloadAutomationPdf(intake.automation_job_id);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Confirmation PDF is not available" },
      { status: upstream.status },
    );
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ds160-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

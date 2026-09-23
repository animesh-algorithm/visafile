import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestRecord = {
  id: string;
  name: string;
  email: string;
  notification_status: string;
  confirmation_status: string;
};

const success = () => NextResponse.json({ ok: true });

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  idempotencyKey: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EARLY_ACCESS_FROM_EMAIL,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 2048) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const fields = body as Record<string, unknown>;
  if (fields.website) return success();
  const name =
    typeof fields.name === "string"
      ? fields.name.trim().replace(/\s+/g, " ")
      : "";
  const email =
    typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  if (
    !name ||
    name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return NextResponse.json(
      { error: "Enter a valid name and email" },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const owner = process.env.EARLY_ACCESS_TO_EMAIL;
  if (
    !url ||
    !key ||
    !owner ||
    !process.env.RESEND_API_KEY ||
    !process.env.EARLY_ACCESS_FROM_EMAIL
  ) {
    console.error("Early access server configuration is incomplete");
    return NextResponse.json(
      { error: "Requests are unavailable" },
      { status: 503 },
    );
  }

  const database = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: inserted, error: insertError } = await database
    .from("early_access_requests")
    .insert({ name, email })
    .select("id,name,email,notification_status,confirmation_status")
    .single();

  let record = inserted as RequestRecord | null;
  if (insertError?.code === "23505") {
    const existing = await database
      .from("early_access_requests")
      .select("id,name,email,notification_status,confirmation_status")
      .eq("email", email)
      .single();
    record = existing.data as RequestRecord | null;
    if (existing.error || !record) return success();
  } else if (insertError || !record) {
    console.error("Early access insert failed", { code: insertError?.code });
    return NextResponse.json(
      { error: "Could not save request" },
      { status: 503 },
    );
  }

  const deliveries = [
    {
      column: "notification_status",
      to: owner,
      subject: "New VisaFile early access request",
      text: `A new VisaFile early access request was saved.\n\nName: ${record.name}\nEmail: ${record.email}\nRequest ID: ${record.id}`,
    },
    {
      column: "confirmation_status",
      to: record.email,
      subject: "We received your VisaFile request",
      text: `Hi ${record.name},\n\nThanks for requesting early access to VisaFile. We have your request and will contact you if an opportunity to try it opens. No DS-160 application has been started or submitted.\n\nVisaFile is not affiliated with the U.S. government and does not provide legal advice.`,
    },
  ] as const;

  await Promise.all(
    deliveries.map(async (delivery) => {
      const { data: claimed, error: claimError } = await database
        .from("early_access_requests")
        .update({ [delivery.column]: "sending" })
        .eq("id", record.id)
        .in(delivery.column, ["pending", "failed"])
        .select("id")
        .maybeSingle();
      if (claimError || !claimed) return;
      let status = "sent";
      try {
        await sendEmail(
          delivery.to,
          delivery.subject,
          delivery.text,
          `${record.id}-${delivery.column}`,
        );
      } catch (error) {
        status = "failed";
        console.error("Early access email failed", {
          id: record.id,
          kind: delivery.column,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
      await database
        .from("early_access_requests")
        .update({ [delivery.column]: status })
        .eq("id", record.id);
    }),
  );

  return success();
}

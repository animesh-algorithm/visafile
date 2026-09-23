"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EarlyAccessForm() {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          website: data.get("website"),
        }),
      });
      setState(response.ok ? "success" : "error");
      if (response.ok) form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p className="rounded-2xl bg-white p-6 text-[var(--ink)]" role="status">
        Thanks for your interest. We’ve received your request and will email you
        when there’s an opportunity to try VisaFile.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <label
          htmlFor="early-access-name"
          className="mb-2 block text-sm font-bold"
        >
          Name
        </label>
        <Input
          id="early-access-name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>
      <div>
        <label
          htmlFor="early-access-email"
          className="mb-2 block text-sm font-bold"
        >
          Email
        </label>
        <Input
          id="early-access-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </div>
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="early-access-website">Website</label>
        <input
          id="early-access-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <p className="text-sm leading-6 text-[var(--muted)]">
        We’ll use your name and email only to respond to this request and
        contact you about early access. This does not start a DS-160
        application.
      </p>
      {state === "error" && (
        <p
          id="early-access-error"
          role="alert"
          className="text-sm font-semibold text-[var(--ink)]"
        >
          We couldn’t save your request. Please try again.
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={state === "sending"}
        aria-describedby={state === "error" ? "early-access-error" : undefined}
        className="w-full"
      >
        {state === "sending" ? "Sending…" : "Request early access"}
      </Button>
    </form>
  );
}

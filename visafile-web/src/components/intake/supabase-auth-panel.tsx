"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VisaFileSupabaseClient } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

export function SupabaseAuthPanel({
  supabase,
  user,
  onMessage,
}: {
  supabase: VisaFileSupabaseClient | null;
  user: User | null;
  onMessage: (message: string | null) => void;
}) {
  const [mode, setMode] = React.useState<AuthMode>("sign-in");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function friendlyAuthError(mode: AuthMode) {
    return mode === "sign-in"
      ? "We couldn’t sign you in. Check your email and password, then try again."
      : "We couldn’t create your account right now. Please try again in a few minutes.";
  }

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
          <div>
            <p className="font-extrabold">Sign-in is not available</p>
            <p className="mt-1 leading-5 text-[var(--muted)]">
              We can’t save your intake for review right now. You can still
              check your answers and try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function signOut() {
    if (!supabase) return;
    setPending(true);
    onMessage(null);
    const { error } = await supabase.auth.signOut();
    setPending(false);
    if (error) {
      console.error("Unable to sign out", error);
      onMessage("We couldn’t sign you out. Please try again.");
      return;
    }
    onMessage("Signed out.");
  }

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setPending(true);
    onMessage(null);

    const auth =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setPending(false);
    if (auth.error) {
      console.error("Authentication failed", auth.error);
      onMessage(friendlyAuthError(mode));
      return;
    }
    onMessage(
      mode === "sign-in"
        ? "Signed in. You can submit from the review step."
        : "Account created. Check your email if we ask you to confirm it.",
    );
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Signed in</p>
            <p className="mt-1 truncate text-[var(--muted)]">{user.email}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={signOut}
          disabled={pending}
          className="mt-4 w-full"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={authenticate}
      className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm"
    >
      <p className="font-extrabold">
        {mode === "sign-in" ? "Sign in to submit" : "Create an account"}
      </p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
            Email
          </span>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
            Password
          </span>
          <Input
            type="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="mt-4 w-full"
      >
        <LogIn className="size-4" />
        {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Sign up"}
      </Button>
      <button
        type="button"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        className="mt-3 w-full rounded-xl px-2 py-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--sky)]"
      >
        {mode === "sign-in"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

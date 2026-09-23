import { EarlyAccessForm } from "@/components/marketing/early-access-form";
import { DemoVideo } from "@/components/marketing/demo-video";
import {
  ArrowRight,
  Check,
  Clock3,
  FileCheck2,
  HeartHandshake,
  LockKeyhole,
  MessageCircleQuestion,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

const steps = [
  {
    n: "01",
    title: "Tell us about you",
    copy: "Answer one clear section at a time, with context when official questions get confusing.",
  },
  {
    n: "02",
    title: "We prepare the form",
    copy: "Your answers are organized for the DS-160 workflow and checked for gaps or inconsistencies.",
  },
  {
    n: "03",
    title: "A human stays in the loop",
    copy: "When something needs judgment, you can review, correct, and approve what happens next.",
  },
  {
    n: "04",
    title: "Keep your confirmation",
    copy: "When your DS-160 is complete, your confirmation can be kept in one easy-to-find place.",
  },
];

export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <nav
        className="page-shell flex h-20 items-center justify-between"
        aria-label="Main navigation"
      >
        <Brand />
        <div className="hidden items-center gap-8 text-sm font-bold md:flex">
          <a href="#how-it-works">How it works</a>
          <a href="#why-visafile">Why VisaFile</a>
          <a href="#demo">Watch demo</a>
        </div>
        <Button asChild size="sm">
          <a href="#early-access">
            Request early access <ArrowRight className="size-4" />
          </a>
        </Button>
      </nav>

      <section className="bg-[var(--primary)] text-white">
        <div className="page-shell grid min-h-[660px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 text-[var(--yellow)]">
              VisaFile is coming soon
            </p>
            <h1 className="display text-5xl leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-[5.1rem]">
              Your visa form, without the maze.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/82">
              We’re building a calmer way to prepare your DS-160. Explore how
              VisaFile is designed to work, then request early access.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="light" size="lg">
                <a href="#early-access">
                  Request early access <ArrowRight className="size-5" />
                </a>
              </Button>
              <a
                href="#demo"
                className="inline-flex min-h-14 items-center justify-center px-5 text-sm font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
              >
                Watch the demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/76">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[var(--yellow)]" /> Join with your
                email
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[var(--yellow)]" /> Be first to
                hear when access opens
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[var(--yellow)]" /> You stay in
                control
              </span>
            </div>
          </div>
          <HeroDocument />
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="page-shell grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="eyebrow text-[var(--primary)]">
              A two-hour form should not feel like a test
            </p>
            <h2 className="display mt-4 text-4xl leading-tight tracking-[-.035em] sm:text-5xl">
              Official questions.
              <br />
              Human explanations.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <PainPoint
              icon={<MessageCircleQuestion />}
              title="Unclear wording"
              copy="Plain-English context is designed to appear when you need it."
              color="bg-[var(--peach)]"
            />
            <PainPoint
              icon={<MousePointerClick />}
              title="Endless pages"
              copy="Related questions are designed to stay together in a clear flow."
              color="bg-[var(--sky)]"
            />
            <PainPoint
              icon={<Clock3 />}
              title="Easy to lose progress"
              copy="Draft answers are designed to stay on your device as you work."
              color="bg-[var(--mint)]"
            />
          </div>
        </div>
      </section>

      <section
        id="demo"
        className="scroll-mt-8 bg-[var(--cream)] py-20 sm:py-28"
      >
        <div className="page-shell">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="eyebrow text-[var(--primary)]">Product preview</p>
            <h2 className="display mt-4 text-4xl tracking-[-.035em] sm:text-5xl">
              See what we’re building.
            </h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">
              Watch a walkthrough of the VisaFile prototype. The guided intake
              is not open to the public yet.
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <DemoVideo />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="page-shell">
          <div className="max-w-2xl">
            <p className="eyebrow text-[var(--primary)]">How it works</p>
            <h2 className="display mt-4 text-4xl tracking-[-.035em] sm:text-5xl">
              From scattered answers to one complete file.
            </h2>
          </div>
          <ol className="mt-14 grid border-y border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li
                key={step.n}
                className="relative border-b border-[var(--border)] py-8 md:px-7 md:odd:border-r lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0"
              >
                <span className="text-sm font-extrabold text-[var(--primary)]">
                  {step.n}
                </span>
                <h3 className="mt-8 text-xl font-extrabold tracking-[-.02em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {step.copy}
                </p>
                {i < 3 && (
                  <ArrowRight className="absolute right-5 top-8 hidden size-5 text-[var(--border)] lg:block" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="why-visafile"
        className="bg-[var(--ink)] py-20 text-white sm:py-28"
      >
        <div className="page-shell grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-md rounded-[2.5rem] bg-[var(--yellow)] p-9 text-[var(--ink)]">
            <div className="dot-grid absolute inset-0 rounded-[2.5rem] opacity-25" />
            <div className="relative flex h-full flex-col justify-between">
              <ShieldCheck className="size-16" />
              <div>
                <p className="display text-5xl leading-none">
                  Careful by design.
                </p>
                <p className="mt-5 max-w-xs leading-7">
                  We’re designing a flow that explains questions, flags what
                  needs attention, and keeps answers editable.
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow text-[var(--yellow)]">
              Trust is part of the interface
            </p>
            <h2 className="display mt-4 text-4xl tracking-[-.035em] sm:text-5xl">
              You should always know what is happening next.
            </h2>
            <div className="mt-10 space-y-7">
              <TrustRow
                icon={<LockKeyhole />}
                title="Your answers stay with you"
                copy="The planned draft stays on your device until you choose to continue."
              />
              <TrustRow
                icon={<HeartHandshake />}
                title="Human review has a purpose"
                copy="The planned workflow keeps judgment and final approval visible to you."
              />
              <TrustRow
                icon={<FileCheck2 />}
                title="Review before anything moves"
                copy="The planned review lets you check and correct answers before anything moves."
              />
            </div>
          </div>
        </div>
      </section>

      <section id="questions" className="bg-[var(--sky)] py-20 sm:py-24">
        <div className="page-shell text-center">
          <Sparkles className="mx-auto size-9 text-[var(--primary)]" />
          <h2 className="display mx-auto mt-5 max-w-3xl text-4xl tracking-[-.04em] sm:text-6xl">
            Want to try VisaFile when it opens?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--muted)]">
            VisaFile is not available yet. Request early access and we’ll let
            you know when there’s an opportunity to try it.
          </p>
          <div id="early-access" className="mx-auto mt-8 max-w-lg scroll-mt-8">
            <EarlyAccessForm />
          </div>
        </div>
      </section>

      <footer className="bg-white py-10">
        <div className="page-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">
            VisaFile is not affiliated with the U.S. government. It does not
            provide legal advice. Requesting access does not start or submit a
            DS-160 application.
          </p>
        </div>
      </footer>
    </main>
  );
}

function PainPoint({
  icon,
  title,
  copy,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  color: string;
}) {
  return (
    <article className={`${color} rounded-[1.75rem] p-6`}>
      <span className="grid size-11 place-items-center rounded-full bg-white [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-8 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
    </article>
  );
}
function TrustRow({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-1 text-[var(--yellow)] [&_svg]:size-6">{icon}</span>
      <div>
        <h3 className="font-extrabold">{title}</h3>
        <p className="mt-1 leading-6 text-white/66">{copy}</p>
      </div>
    </div>
  );
}
function HeroDocument() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] pb-10">
      <div className="absolute -right-4 top-8 size-32 rotate-6 rounded-[2rem] bg-[var(--peach)]" />
      <div className="absolute -left-5 bottom-0 size-28 -rotate-6 rounded-full bg-[var(--yellow)]" />
      <div className="relative rotate-[1.5deg] rounded-[2rem] bg-white p-6 text-[var(--ink)] shadow-[0_28px_70px_rgb(19_30_80/30%)] sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--mint)]">
              <FileCheck2 className="size-5 text-[var(--success)]" />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--muted)]">
                INTAKE PREVIEW
              </p>
              <p className="font-extrabold">Personal information</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--mint)] px-3 py-1 text-xs font-bold text-[var(--success)]">
            Example
          </span>
        </div>
        <div className="py-7">
          <p className="text-xs font-extrabold text-[var(--primary)]">
            STEP 2 OF 9
          </p>
          <h2 className="display mt-2 text-3xl">Let’s start with your name.</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter it exactly as it appears in your passport.
          </p>
          <div className="mt-6 space-y-4">
            <FakeInput label="Surname" value="JORDAN" />
            <FakeInput label="Given names" value="HAL" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
          <span className="text-xs font-bold text-[var(--muted)]">
            Sample progress
          </span>
          <span className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white">
            Next section →
          </span>
        </div>
      </div>
    </div>
  );
}
function FakeInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold">{label}</p>
      <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm">
        {value}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const videoUrl = "https://www.youtube.com/watch?v=IomQnHifsFU";

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-[1.75rem] bg-[var(--ink)] text-white sm:rounded-[2.25rem]">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src="https://www.youtube-nocookie.com/embed/IomQnHifsFU?autoplay=1"
            title="VisaFile MVP Demo"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-4 p-5 text-center outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--yellow)]"
            aria-label="Play the VisaFile demo video"
          >
            <span className="grid size-16 place-items-center rounded-full bg-[var(--yellow)] text-[var(--ink)] sm:size-20">
              <Play
                className="size-7 fill-current sm:size-8"
                aria-hidden="true"
              />
            </span>
            <span className="text-sm font-bold sm:text-lg">
              Watch the VisaFile demo
            </span>
          </button>
        )}
      </div>
      <p className="mt-4 text-center text-sm leading-6 text-[var(--muted)]">
        Playing the demo loads YouTube.{" "}
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[var(--primary-deep)] underline underline-offset-4 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Open it on YouTube
        </a>
        .
      </p>
    </div>
  );
}

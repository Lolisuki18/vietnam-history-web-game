"use client";

import { Button } from "@vhg/ui";
import { ArrowLeft } from "lucide-react";

import { CodexContent } from "./codex-content";

/** The Codex as a full-screen overlay inside the chapter shell. */
export function CodexScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-stone-950/95 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto mb-6 flex w-full max-w-3xl">
        <Button variant="secondary" onClick={onClose}>
          <ArrowLeft className="size-4" aria-hidden /> Quay lại
        </Button>
      </div>
      <CodexContent />
    </div>
  );
}

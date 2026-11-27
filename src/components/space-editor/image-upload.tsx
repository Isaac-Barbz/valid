"use client";

import { useState, useTransition, type ReactNode } from "react";

import { uploadSpaceImage } from "@/app/actions";
import { resizeToWebp } from "@/lib/resize-image";

const MAX_WIDTH = { banner: 1600, photo: 1200, backdrop: 1600 } as const;

/** File picker that shrinks the image in the browser, uploads it, and hands back its path and URL. */
export function ImageUpload({
  kind,
  label,
  disabled = false,
  onUploaded,
}: {
  kind: keyof typeof MAX_WIDTH;
  label: ReactNode;
  disabled?: boolean;
  onUploaded: (path: string, url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-control border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-accent ${
          disabled || isPending ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {isPending ? "Uploading…" : label}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || isPending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setError(null);
            startTransition(async () => {
              try {
                const formData = new FormData();
                formData.set("kind", kind);
                formData.set("file", await resizeToWebp(file, MAX_WIDTH[kind]));
                const result = await uploadSpaceImage(formData);
                if (result.ok) onUploaded(result.path, result.url);
                else setError(result.error);
              } catch {
                setError("Couldn't read that image. Try a JPG or PNG.");
              }
            });
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Nothing here</h1>
      <p className="text-text-muted">That page doesn&apos;t exist or was removed.</p>
      <Link href="/" className={buttonStyles()}>
        Back to the feed
      </Link>
    </main>
  );
}

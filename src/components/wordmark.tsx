import Link from "next/link";

import { TERMS } from "@/lib/copy";

export function Wordmark() {
  return (
    <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
      {TERMS.brand.toLowerCase()}
      <span className="text-accent">.</span>
    </Link>
  );
}

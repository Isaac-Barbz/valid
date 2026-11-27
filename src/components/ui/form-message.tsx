import type { ActionResult } from "@/lib/types";

/** Inline result line for a form action: error in red, success in green. */
export function FormMessage({ state, success }: { state: ActionResult | null; success?: string }) {
  if (!state) return null;
  if (state.ok) {
    return success ? (
      <p role="status" className="text-sm text-success">
        {success}
      </p>
    ) : null;
  }
  return (
    <p role="alert" className="text-sm text-danger">
      {state.error}
    </p>
  );
}

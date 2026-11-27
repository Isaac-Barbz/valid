import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-card border border-card-outline bg-surface shadow-card ${className}`} {...props} />;
}

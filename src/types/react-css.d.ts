import "react";

declare module "react" {
  /** Allow CSS custom properties (design tokens) in `style`. */
  interface CSSProperties {
    [key: `--${string}`]: string;
  }
}

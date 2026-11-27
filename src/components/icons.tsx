import type { SVGProps } from "react";

/** Small inline icon set (stroke icons, 24px grid). */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);

export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
);

export const CommentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </Icon>
);

export const FlagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 22V4M4 4h12l-2 4 2 4H4" />
  </Icon>
);

export const MaskIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 8c3-2 15-2 18 0 0 6-3 10-6 10-1.5 0-2-2-3-2s-1.5 2-3 2c-3 0-6-4-6-10Z" />
    <path d="M8 11h2M14 11h2" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CheckBadgeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2Z" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Icon>
);

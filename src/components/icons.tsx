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

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
  </Icon>
);

export const UserIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const UserPlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10" cy="8" r="4" />
    <path d="M2 21a8 8 0 0 1 13-6.2M19 14v6M16 17h6" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Icon>
);

export const MailIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

export const MusicIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </Icon>
);

export const PlayIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 4.5v15l13-7.5Z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 5v14M16 5v14" strokeWidth={3} />
  </Icon>
);

export const PaletteIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.2.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" />
    <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="15" cy="8" r="1" fill="currentColor" />
  </Icon>
);

export const CheckBadgeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2Z" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Icon>
);

export const LinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </Icon>
);

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 17v5" />
    <path d="M9 3h6l-1 6 4 4v2H6v-2l4-4z" />
  </Icon>
);

export const TvIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="m8 2 4 4 4-4" />
  </Icon>
);

export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Icon>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const GripIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6h0M15 6h0M9 12h0M15 12h0M9 18h0M15 18h0" strokeWidth={3} />
  </Icon>
);

export const FlameIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4.5-9.5-.5 2.5-2 4-3.5 4.5C11 7 10 4.5 10 2 6.5 5 5 9.5 5 15c0 4.3 3 7 7 7Z" />
  </Icon>
);

export const StreetIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 21 9 3M20 21 15 3M12 6v2M12 11v2M12 16v2" />
  </Icon>
);

export const CommunitiesIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 5.5a3 3 0 0 1 0 5M18 14.5c1.8.9 3 2.9 3 5.5" />
  </Icon>
);

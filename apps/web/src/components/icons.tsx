type IconProps = { className?: string };

const base = "size-[18px] shrink-0";

function Svg({
  className,
  children,
  strokeWidth = 1.6,
}: IconProps & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      className={className ?? base}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7" />
    </Svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9z" />
    </Svg>
  );
}

export function MonitorIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 14v3" />
    </Svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.7}>
      <circle cx="8.8" cy="8.8" r="5.3" />
      <path d="M13 13l4.2 4.2" />
    </Svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.9}>
      <path d="M10 16V4M5 9l5-5 5 5" />
    </Svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.7}>
      <path d="M5 5l10 10M15 5 5 15" />
    </Svg>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.2V6h-2.8" />
    </Svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 8h8.5a3.5 3.5 0 1 1 0 7H8M7 5 4 8l3 3" />
    </Svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.5 11.6 7l4.4 1.5-4.4 1.5L10 14.5 8.4 10 4 8.5 8.4 7z" />
      <path d="M15.5 13.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
    </Svg>
  );
}

export function StarIcon({
  className,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      className={className ?? "size-[11px] shrink-0"}
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.8 11.2 5.4 7.4A2 2 0 0 1 7.2 6.2h5.6a2 2 0 0 1 1.8 1.2l1.6 3.8" />
      <path d="M3.5 11.2h13a1 1 0 0 1 1 1v3.3a.5.5 0 0 1-.5.5h-1.8a1 1 0 0 1-1-1V14.5H5.8V15a1 1 0 0 1-1 1H3a.5.5 0 0 1-.5-.5v-3.3a1 1 0 0 1 1-1z" />
      <path d="M5.8 13.5h1.4M12.8 13.5h1.4" />
    </Svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </Svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 12.5V3.5M6.5 7 10 3.5 13.5 7" />
      <path d="M4 12v3a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 16 15v-3" />
    </Svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.6 10a6.4 6.4 0 1 0 1.9-4.5M3.5 3.6v3.2h3.2" />
      <path d="M10 6.6V10l2.4 1.5" />
    </Svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <path d="M10 4v12M4 10h12" />
    </Svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 7.5l5 5 5-5" />
    </Svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.4}>
      <path d="M8.6 2.8h2.8l.4 2.1 1.5.9 2-.7 1.4 2.4-1.6 1.4v1.7l1.6 1.4-1.4 2.4-2-.7-1.5.9-.4 2.1H8.6l-.4-2.1-1.5-.9-2 .7-1.4-2.4 1.6-1.4V9.6L3.3 8.2l1.4-2.4 2 .7 1.5-.9z" />
      <circle cx="10" cy="10" r="2.3" />
    </Svg>
  );
}

export function FuelIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 17V4.5A1.5 1.5 0 0 1 5.5 3h5A1.5 1.5 0 0 1 12 4.5V17M3 17h10M5.8 5.8h4.4v3.4H5.8z" />
      <path d="M12 8.5h1.4a1.4 1.4 0 0 1 1.4 1.4v3.8a1 1 0 0 0 2 0V7.2L15 5.4" />
    </Svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.6 4.2 4.9v4.4c0 3.7 2.5 6.5 5.8 7.8 3.3-1.3 5.8-4.1 5.8-7.8V4.9z" />
      <path d="M7.6 10l1.7 1.7 3.2-3.4" />
    </Svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M11 2.5 4.6 11h4.4l-1 6.5L15.4 9H11z" />
    </Svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="7.8" cy="7" r="2.8" />
      <path d="M2.5 16.5a5.3 5.3 0 0 1 10.6 0M13.6 4.6a2.8 2.8 0 0 1 0 4.8M17.5 16.5a4.6 4.6 0 0 0-3-4.3" />
    </Svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 3h6.4l7.6 7.6-6.4 6.4L3 9.4z" />
      <circle cx="6.6" cy="6.6" r="1" />
    </Svg>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="6.5" cy="13.5" r="3" />
      <path d="M8.6 11.4 16.5 3.5M14 6l2 2M11.8 8.2l2 2" />
    </Svg>
  );
}

export function CompareIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 7h11M11 4l3 3-3 3M17 13H6M9 10l-3 3 3 3" />
    </Svg>
  );
}

export function CodeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 6 3 10l4 4M13 6l4 4-4 4" />
    </Svg>
  );
}

export function ShuffleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 6h2.6c1 0 1.9.5 2.5 1.3l3.8 5.4c.6.8 1.5 1.3 2.5 1.3H17M3 14h2.6c1 0 1.9-.5 2.5-1.3l.6-.9M11.3 8.2l.6-.9c.6-.8 1.5-1.3 2.5-1.3H17" />
      <path d="M15.2 4.2 17 6l-1.8 1.8M15.2 12.2 17 14l-1.8 1.8" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.9}>
      <path d="M4 10.5 8 14.5 16 6" />
    </Svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 3.2 2.8 16h14.4z" />
      <path d="M10 8v4M10 14.2v.1" />
    </Svg>
  );
}

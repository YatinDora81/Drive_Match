type IconProps = { className?: string };

function Svg({
  className,
  children,
  strokeWidth = 1.7,
}: IconProps & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      className={className ?? "size-[18px] shrink-0"}
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
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.5v1.6M10 15.9v1.6M17.5 10h-1.6M4.1 10H2.5M15.3 4.7l-1.1 1.1M5.8 14.2l-1.1 1.1M15.3 15.3l-1.1-1.1M5.8 5.8 4.7 4.7" />
    </Svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.2 11.8A6.8 6.8 0 1 1 8.2 3.8a7.4 7.4 0 0 0 8 8Z" />
    </Svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <circle cx="8.8" cy="8.8" r="5.4" />
      <path d="m13.2 13.2 4.1 4.1" />
    </Svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.9}>
      <path d="M4 10h12M11 5l5 5-5 5" />
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
    <Svg className={className} strokeWidth={1.9}>
      <path d="m5 5 10 10M15 5 5 15" />
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
    <svg
      className={className ?? "size-[18px] shrink-0"}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m10 2.2 1.9 4.9 4.9 1.9-4.9 1.9L10 15.8l-1.9-4.9L3.2 9l4.9-1.9z" />
      <path d="m15.6 13.6.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.6}>
      <path d="M3.8 11.2 5.4 7.4A2 2 0 0 1 7.2 6.2h5.6a2 2 0 0 1 1.8 1.2l1.6 3.8" />
      <path d="M3.5 11.2h13a1 1 0 0 1 1 1v3.3a.5.5 0 0 1-.5.5h-1.8a1 1 0 0 1-1-1v-.5H5.8v.5a1 1 0 0 1-1 1H3a.5.5 0 0 1-.5-.5v-3.3a1 1 0 0 1 1-1z" />
      <path d="M5.8 13.5h1.4M12.8 13.5h1.4" />
    </Svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    </Svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="10" r="6.6" />
      <path d="M10 6.4V10l2.4 1.8" />
    </Svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M10 4v12M4 10h12" />
    </Svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.6 4.2 4.9v4.4c0 3.7 2.5 6.5 5.8 7.8 3.3-1.3 5.8-4.1 5.8-7.8V4.9z" />
      <path d="m7.6 10 1.7 1.7 3.2-3.4" />
    </Svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg
      className={className ?? "size-[18px] shrink-0"}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11 2 4.5 11h4.4L8 18l6.9-9.2h-4.4z" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.6}>
      <rect x="3" y="3" width="5.6" height="5.6" rx="1.6" />
      <rect x="11.4" y="3" width="5.6" height="5.6" rx="1.6" />
      <rect x="3" y="11.4" width="5.6" height="5.6" rx="1.6" />
      <rect x="11.4" y="11.4" width="5.6" height="5.6" rx="1.6" />
    </Svg>
  );
}

export function RupeeIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <path d="M5.5 3.5h9M5.5 7h9M12.4 3.5c1.6 0 2.6 1.4 2.6 3s-1 3.1-2.6 3.1H5.5l6.8 7" />
    </Svg>
  );
}

export function SeatIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3.8h5.7a1.6 1.6 0 0 1 1.6 1.8l-.6 5.6H6.8z" />
      <path d="M5.6 11.2h9.2a1.7 1.7 0 0 1 1.7 1.7v3.3H5.8a2.2 2.2 0 0 1-2.2-2.2V7" />
    </Svg>
  );
}

export function DropIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.8s4.8 4.8 4.8 8a4.8 4.8 0 0 1-9.6 0c0-3.2 4.8-8 4.8-8Z" />
    </Svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 17.5s5.4-4.9 5.4-9.2a5.4 5.4 0 1 0-10.8 0c0 4.3 5.4 9.2 5.4 9.2Z" />
      <circle cx="10" cy="8.2" r="1.9" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2.2}>
      <path d="m4 10.5 4 4 8-8.5" />
    </Svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 3.2 2.8 16h14.4z" />
      <path d="M10 8v3.6M10 13.9v.1" />
    </Svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M10 3a7 7 0 1 1-7 7" />
    </Svg>
  );
}

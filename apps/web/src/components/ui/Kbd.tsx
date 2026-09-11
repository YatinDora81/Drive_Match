export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid min-w-[20px] place-items-center rounded-[6px] border border-line bg-card px-1.5 py-px font-sans text-[11px] font-bold text-ink-3 shadow-card">
      {children}
    </kbd>
  );
}

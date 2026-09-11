export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[5px] border border-line bg-card px-[5px] py-[1px] font-mono text-[10px] text-muted shadow-card">
      {children}
    </kbd>
  );
}

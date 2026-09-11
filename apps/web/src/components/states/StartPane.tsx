type Props = { children?: React.ReactNode };

export function StartPane({ children }: Props) {
  return (
    <section
      aria-labelledby="start-title"
      className="animate-rise mx-auto max-w-[560px] px-5 pb-6 pt-14 text-center md:pt-20"
    >
      <div
        aria-hidden="true"
        className="mb-[18px] font-display text-[52px] font-bold leading-none text-rule-2"
      >
        ¶
      </div>
      <h3
        id="start-title"
        className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink md:text-[30px]"
      >
        Search the catalogue the way you’d say it
      </h3>
      <p className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-[1.66] tracking-[-0.006em] text-ink-3">
        Budget, fuel, gearbox, city, seats, safety, mileage, what you want it for.
        Plain words in, understood filters out, and every loosened constraint is
        shown, never hidden.
      </p>
      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}

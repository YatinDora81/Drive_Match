import { CarIcon } from "../icons";

type Props = { children?: React.ReactNode };

export function StartPane({ children }: Props) {
  return (
    <section
      aria-labelledby="start-title"
      className="animate-rise mx-auto w-full max-w-[1040px] px-5 pb-6 pt-[8vh] md:pt-[14vh]"
    >
      <div className="text-center">
        <h1
          id="start-title"
          className="inline-flex items-center gap-3 text-[26px] font-bold leading-[1.15] tracking-[-0.025em] text-ink md:text-[28px]"
        >
          <span className="grid size-9 place-items-center rounded-[11px] bg-primary-soft text-primary">
            <CarIcon className="size-5" />
          </span>
          Hi, I’m Drive Match
        </h1>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-body">
          Describe the car you want, the way you’d say it.
        </p>
      </div>
      {children}
    </section>
  );
}

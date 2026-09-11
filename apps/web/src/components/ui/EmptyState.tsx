import { SOFT, type Tone } from "../../lib/tones";

type Props = {
  tone?: Tone;
  icon: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export function EmptyState({ tone = "brand", icon, eyebrow, title, children, actions }: Props) {
  return (
    <div className="animate-rise rounded-panel border border-line bg-card px-5 py-12 text-center shadow-card sm:px-8">
      <span
        aria-hidden="true"
        className={`mx-auto mb-4 grid size-14 place-items-center rounded-panel [&_svg]:size-6 ${SOFT[tone]}`}
      >
        {icon}
      </span>
      {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
      <h3 className="mx-auto max-w-[36ch] text-[22px] leading-tight font-extrabold tracking-[-0.03em] text-balance text-ink">
        {title}
      </h3>
      {children ? (
        <div className="mx-auto mt-3 max-w-[54ch] text-[15px] leading-relaxed text-ink-2">
          {children}
        </div>
      ) : null}
      {actions ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

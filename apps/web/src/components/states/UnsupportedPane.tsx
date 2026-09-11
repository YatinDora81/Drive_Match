type Props = {
  message: string | null;
  children?: React.ReactNode;
};

export function UnsupportedPane({ message, children }: Props) {
  return (
    <div className="animate-rise grid place-items-center px-5 py-14">
      <div className="max-w-[520px] text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-lavender-line bg-lavender-bg text-[22px] font-semibold text-lavender"
        >
          ?
        </div>
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">
          That does not read like a car search
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-[1.66] text-body">
          {message ??
            "This search only understands questions about the used-car catalogue."}{" "}
          Describe the kind of car, the budget, or where you are looking — something
          like these.
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}

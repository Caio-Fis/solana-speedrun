export function SplitRow({
  index,
  label,
  meta,
  children,
}: {
  index: string;
  label: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-4 sm:px-8">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs text-muted" aria-hidden>
            {index}
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">
            {label}
          </h2>
        </div>
        {meta ? (
          <span className="font-mono text-xs text-muted">{meta}</span>
        ) : null}
      </header>
      <div className="px-5 pb-7 sm:px-8">{children}</div>
    </section>
  );
}

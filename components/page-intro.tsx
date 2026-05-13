type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="design-page-intro grid gap-2 border-b border-[var(--color-line)] pb-5 md:pb-6">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-muted)]">{eyebrow}</div>
      <h1 className="max-w-4xl font-display text-[24px] leading-none tracking-[0.03em] text-[var(--color-ink)] md:text-[34px]">
        {title}
      </h1>
      <p className="max-w-2xl text-[12px] leading-6 text-[var(--color-muted)]">{description}</p>
    </div>
  );
}

type PageErrorStateProps = {
  title?: string;
  description?: string;
};

export function PageErrorState({
  title = "Something went wrong",
  description = "Something went wrong. Try again or contact us on WhatsApp.",
}: PageErrorStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-error-bg)] px-6 py-8 shadow-[var(--shadow-card)]">
      <p className="editorial-label text-[var(--color-error-text)]">Attention required</p>
      <h2 className="mt-3 text-xl text-[var(--color-error-text)]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--color-error-text)]">{description}</p>
    </div>
  );
}

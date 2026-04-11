type PageEmptyStateProps = {
  title: string;
  description: string;
};

export function PageEmptyState({
  title,
  description,
}: PageEmptyStateProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-dashed border-border bg-white p-6 text-left sm:p-8 sm:text-center">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

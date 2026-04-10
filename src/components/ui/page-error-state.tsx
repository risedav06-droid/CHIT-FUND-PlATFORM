type PageErrorStateProps = {
  title?: string;
  description?: string;
};

export function PageErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded right now. Please try again.",
}: PageErrorStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-8">
      <h2 className="text-xl font-semibold text-rose-900">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-rose-800">{description}</p>
    </div>
  );
}

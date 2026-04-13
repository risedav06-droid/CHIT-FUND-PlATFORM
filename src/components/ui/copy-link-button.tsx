'use client';

type CopyLinkButtonProps = {
  value: string;
};

export function CopyLinkButton({ value }: CopyLinkButtonProps) {
  return (
    <button
      type="button"
      className="ghost-button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
      }}
    >
      Copy Link
    </button>
  );
}

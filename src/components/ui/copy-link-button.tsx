'use client';

type CopyLinkButtonProps = {
  value: string;
  label?: string;
};

export function CopyLinkButton({ value, label = "Copy Link" }: CopyLinkButtonProps) {
  return (
    <button
      type="button"
      className="ghost-button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
      }}
    >
      {label}
    </button>
  );
}

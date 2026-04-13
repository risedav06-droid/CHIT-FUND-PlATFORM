'use client';

import { useState } from "react";

type MemberInviteActionsProps = {
  token: string;
  chitName: string;
};

export function MemberInviteActions({
  token,
  chitName,
}: MemberInviteActionsProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window === "undefined"
      ? `/member/${token}`
      : `${window.location.origin}/member/${token}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="ghost-button"
        onClick={async () => {
          const link =
            typeof window === "undefined"
              ? inviteLink
              : `${window.location.origin}/member/${token}`;
          await navigator.clipboard.writeText(link);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied! ✓" : "Copy Link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Hi! Here's your ChitMate portal link for ${chitName}: ${inviteLink}`,
        )}`}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-button"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}

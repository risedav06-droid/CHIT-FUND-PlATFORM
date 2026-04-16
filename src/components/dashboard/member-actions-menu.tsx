'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MemberActionsMenuProps = {
  groupId: string;
  memberId: string;
  token: string;
  chitName: string;
  canMarkPaid: boolean;
  onMarkPaid?: () => void;
};

export function MemberActionsMenu({
  groupId,
  memberId,
  token,
  chitName,
  canMarkPaid,
  onMarkPaid,
}: MemberActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  async function copyInviteLink() {
    const inviteLink = `${window.location.origin}/member/${token}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setOpen(false);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    const inviteLink = `${window.location.origin}/member/${token}`;
    const message = `Hi! Here's your ChitMate portal link for ${chitName}: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setShared(true);
    setOpen(false);
    window.setTimeout(() => setShared(false), 2000);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-surface-low)] text-lg text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-high)]"
        title={copied ? "Copied! ✓" : shared ? "Shared" : "More actions"}
      >
        {copied || shared ? "✓" : "⋮"}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-12 z-30 min-w-[220px] rounded-[var(--radius-card)] bg-white py-2 shadow-[var(--shadow-float)]"
          role="menu"
        >
          {canMarkPaid && onMarkPaid ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onMarkPaid();
              }}
              className="flex h-9 w-full items-center px-4 text-left text-sm text-[var(--color-success-text)] hover:bg-[var(--color-surface-low)]"
              role="menuitem"
            >
              ✓ Mark as Paid
            </button>
          ) : null}

          <button
            type="button"
            onClick={copyInviteLink}
            className="flex h-9 w-full items-center px-4 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)]"
            role="menuitem"
          >
            {copied ? "✓ Copied!" : "🔗 Copy Invite Link"}
          </button>

          <button
            type="button"
            onClick={shareOnWhatsApp}
            className="flex h-9 w-full items-center px-4 text-left text-sm text-[var(--color-whatsapp)] hover:bg-[var(--color-surface-low)]"
            role="menuitem"
          >
            💬 Share on WhatsApp
          </button>

          <div className="my-2 h-px bg-[rgba(193,200,194,0.18)]" />

          <Link
            href={`/dashboard/chit-groups/${groupId}/members/${memberId}`}
            className="flex h-9 items-center px-4 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)]"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            👁 View Member
          </Link>
        </div>
      ) : null}
    </div>
  );
}

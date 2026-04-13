'use client';

import { useEffect } from "react";

import { PageErrorState } from "@/components/ui/page-error-state";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <PageErrorState />
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="primary-button inline-flex items-center px-4 py-2 text-sm font-semibold"
      >
        Reload This Page
      </button>
    </div>
  );
}

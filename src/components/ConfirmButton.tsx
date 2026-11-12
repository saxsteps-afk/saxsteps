"use client";

import { useState, type ReactNode } from "react";

export function ConfirmButton({
  confirmMessage,
  onConfirm,
  children,
  className,
  disabled,
}: {
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || pending}
      className={className}
      onClick={async () => {
        if (!confirm(confirmMessage)) return;
        setPending(true);
        try {
          await onConfirm();
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </button>
  );
}

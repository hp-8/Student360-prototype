"use client";

import type { ComponentProps } from "react";

// A plain submit button that asks for confirmation before letting the
// enclosing form actually submit - for destructive actions (delete) where
// a plain click is too easy to trigger by mistake.
export function ConfirmButton({
  confirmText,
  ...props
}: { confirmText: string } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    />
  );
}

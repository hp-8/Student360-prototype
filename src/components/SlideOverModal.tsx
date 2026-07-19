"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SlideOverModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        onClick={() => router.back()}
        className="absolute inset-0 bg-[var(--navy-deep)]/40 backdrop-blur-[1px] cursor-default"
      />
      <div className="slide-in-panel relative w-full max-w-2xl h-full bg-[var(--paper)] shadow-2xl overflow-y-auto">
        <button
          onClick={() => router.back()}
          aria-label="Close panel"
          className="sticky top-4 float-right mr-4 z-10 flex items-center justify-center w-8 h-8 rounded-[3px] bg-[var(--card)] border border-[var(--paper-line)] text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/30 shadow-sm"
        >
          ✕
        </button>
        <div className="p-6 pt-4 clear-both">{children}</div>
      </div>
      <style>{`
        .slide-in-panel {
          animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .slide-in-panel { animation: none; }
        }
      `}</style>
    </div>
  );
}

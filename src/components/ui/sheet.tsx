"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet on phones, centered dialog on bigger screens.
 * Built on <dialog> → focus trap, Esc to close and screen-reader support for free.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none animate-sheet-up overflow-hidden rounded-t-3xl bg-white p-0 shadow-2xl",
        "sm:m-auto sm:max-w-lg sm:rounded-3xl",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 pt-3 pb-3">
            <div className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-zinc-200 sm:hidden" />
            <h2 className="pt-2 text-lg font-bold text-zinc-900">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="mt-2 rounded-full p-2 text-zinc-500 hover:bg-zinc-100">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="safe-bottom border-t border-zinc-100 px-5 pt-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

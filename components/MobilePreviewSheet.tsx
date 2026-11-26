"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function MobilePreviewSheet({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 761px)");
    const resized = () => {
      if (desktop.matches) close.current();
    };
    desktop.addEventListener("change", resized);
    return () => {
      desktop.removeEventListener("change", resized);
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="mobile-preview-sheet"
      aria-labelledby="mobile-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header>
        <h2 id="mobile-preview-title">Live wallpaper preview</h2>
        <button
          className="button secondary"
          autoFocus
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
      </header>
      <div className="mobile-preview-content">{children}</div>
    </dialog>
  );
}

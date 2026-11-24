import { HeartHandshake, X } from "lucide-react";
import { useEffect, useState } from "react";

type SupportEarnEdModalProps = {
  onClose: () => void;
};

export function SupportEarnEdModal({ onClose }: SupportEarnEdModalProps) {
  const [qrUnavailable, setQrUnavailable] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/65 p-3 backdrop-blur-md sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-earned-title"
        aria-describedby="support-earned-description"
        className="relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-line bg-surface text-ink shadow-2xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close support message"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:right-4 sm:top-4"
        >
          <X size={18} />
        </button>

        <div className="relative grid gap-4 p-4 sm:grid-cols-[1fr_0.9fr] sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark dark:text-brand">
              <HeartHandshake size={23} />
            </div>

            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[.17em] text-brand-dark dark:text-brand">
              A little kindness goes a long way
            </p>
            <h2 id="support-earned-title" className="mt-1.5 max-w-sm font-display text-[1.65rem] font-extrabold leading-tight tracking-tight sm:text-3xl">
              Help keep EarnEd growing.
            </h2>
            <p id="support-earned-description" className="mt-2 max-w-sm text-xs leading-[1.65] text-muted sm:text-sm">
              EarnEd is free for every tutor. If it has helped you, you can optionally chip in toward hosting and maintenance, helping me keep it running while I finish my studies.
            </p>

            <div className="mt-4 rounded-2xl border border-brand/15 bg-brand-soft/65 px-3.5 py-3 dark:bg-brand/10">
              <p className="text-xs font-bold leading-5 text-brand-dark dark:text-brand">
                Always free. No subscriptions. No locked features. No pressure.
              </p>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-muted">
              Thank you for being part of the EarnEd community. Your support is appreciated, never expected.
            </p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-line bg-canvas p-3 sm:p-4">
            <div className="flex w-full items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold">Support via GCash</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted sm:text-xs">
                  Scan with your GCash app
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand-dark dark:text-brand">
                Optional
              </span>
            </div>

            <div className="mt-3 flex h-[164px] w-[164px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:mt-4 sm:h-[210px] sm:w-[210px] sm:p-2.5">
              {qrUnavailable ? (
                <p className="px-3 text-center text-[11px] leading-5 text-slate-600">
                  The GCash QR image could not be loaded. Please try again later.
                </p>
              ) : (
                <img
                  src="/My_gcash.jpg"
                  alt="GCash QR code for voluntarily supporting EarnEd"
                  onError={() => setQrUnavailable(true)}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted">
              Any amount, only if you wish.
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-t border-line bg-soft/40 px-4 py-3 sm:px-6">
          <p className="hidden text-[11px] leading-4 text-muted sm:block">
            Thank you for helping keep this free tool available.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:ml-auto sm:w-auto sm:min-w-32"
          >
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}

import { HeartHandshake, X } from "lucide-react";
import { useEffect, useState } from "react";

type SupportEarnEdModalProps = {
  onClose: () => void;
};

export function SupportEarnEdModal({ onClose }: SupportEarnEdModalProps) {
  const [qrUnavailable, setQrUnavailable] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (qrExpanded) {
          setQrExpanded(false);
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, qrExpanded]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-2 backdrop-blur-md sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-earned-title"
        aria-describedby="support-earned-description"
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl sm:rounded-[1.75rem]"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close support message"
          className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:right-4 sm:top-4"
        >
          <X size={20} />
        </button>

        <div className="relative grid gap-3 p-3 pt-4 sm:gap-4 sm:p-4 md:grid-cols-[1.05fr_0.95fr] md:gap-7 md:p-7">
          <div className="flex min-w-0 flex-col justify-center pr-9 sm:pr-10 md:pr-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark dark:text-brand sm:h-11 sm:w-11 sm:rounded-2xl">
              <HeartHandshake size={20} />
            </div>

            <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[.15em] text-brand-dark dark:text-brand sm:mt-3 sm:text-[10px] sm:tracking-[.17em]">
              A little kindness goes a long way
            </p>
            <h2 id="support-earned-title" className="mt-1 max-w-sm font-display text-[1.35rem] font-extrabold leading-tight tracking-tight sm:text-3xl">
              Help keep EarnEd growing.
            </h2>
            <p id="support-earned-description" className="mt-1.5 max-w-md text-[11px] leading-[1.55] text-muted sm:mt-2 sm:text-sm sm:leading-[1.7]">
              EarnEd is free for every tutor. If it has helped you, you can optionally chip in toward hosting and maintenance, helping me keep it running while I finish my studies.
            </p>

            <div className="mt-2.5 rounded-xl border border-brand/15 bg-brand-soft/65 px-3 py-2 dark:bg-brand/10 sm:mt-4 sm:rounded-2xl sm:px-3.5 sm:py-3">
              <p className="text-[11px] font-bold leading-4 text-brand-dark dark:text-brand sm:text-xs sm:leading-5">
                Always free. No subscriptions. No locked features. No pressure.
              </p>
            </div>

            <p className="mt-2 hidden max-w-md text-[11px] leading-5 text-muted sm:block sm:mt-3 sm:text-xs">
              Thank you for being part of the EarnEd community. Your support is appreciated, never expected.
            </p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-line bg-canvas p-2.5 sm:rounded-2xl sm:p-4 md:p-5">
            <div className="flex w-full items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold sm:text-sm">Support via GCash</p>
                <p className="mt-0.5 text-[9px] leading-3.5 text-muted sm:text-xs sm:leading-4">
                  Tap the QR code to enlarge
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-soft px-2 py-1 text-[9px] font-bold text-brand-dark dark:text-brand sm:px-2.5 sm:text-[10px]">
                Optional
              </span>
            </div>

            <div className="mt-2 flex h-[clamp(112px,30vw,164px)] w-[clamp(112px,30vw,164px)] items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:mt-4 sm:h-[210px] sm:w-[210px] sm:rounded-2xl sm:p-2.5">
              {qrUnavailable ? (
                <p className="px-2 text-center text-[10px] leading-4 text-slate-600 sm:px-3 sm:text-[11px] sm:leading-5">
                  The GCash QR image could not be loaded. Please try again later.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setQrExpanded(true)}
                  aria-label="Enlarge GCash QR code"
                  className="h-full w-full cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <img
                    src="/My_gcash.jpg"
                    alt="GCash QR code for voluntarily supporting EarnEd"
                    onError={() => setQrUnavailable(true)}
                    className="h-full w-full object-contain"
                  />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-center text-[9px] leading-3.5 text-muted sm:mt-2 sm:text-[10px] sm:leading-4">
              Any amount, only if you wish.
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-t border-line bg-soft/40 px-3 py-2.5 sm:px-6 sm:py-3">
          <p className="hidden text-xs leading-5 text-muted sm:block">
            Thank you for helping keep this free tool available.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:ml-auto sm:w-auto sm:min-w-32"
          >
            Maybe later
          </button>
        </div>
      </section>

      {qrExpanded && !qrUnavailable && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged GCash QR code"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQrExpanded(false);
          }}
        >
          <button
            type="button"
            onClick={() => setQrExpanded(false)}
            aria-label="Close enlarged QR code"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={22} />
          </button>
          <img
            src="/My_gcash.jpg"
            alt="Enlarged GCash QR code for voluntarily supporting EarnEd"
            className="max-h-[88dvh] max-w-[min(92vw,720px)] rounded-xl bg-white p-2 object-contain shadow-2xl"
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs font-medium text-white/75">
            Tap outside or press Esc to close
          </p>
        </div>
      )}
    </div>
  );
}

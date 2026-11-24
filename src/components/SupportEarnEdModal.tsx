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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-earned-title"
        aria-describedby="support-earned-description"
        className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface text-ink shadow-2xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative p-5 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support message"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <X size={19} />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark dark:text-brand">
            <HeartHandshake size={25} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-brand-dark dark:text-brand">
            Optional community support
          </p>
          <h2 id="support-earned-title" className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Help keep EarnEd running
          </h2>
          <p id="support-earned-description" className="mt-3 text-sm leading-6 text-muted">
            EarnEd is free to use, and it will stay that way. If this tool has been helpful,
            you may optionally support its hosting and maintenance so I can keep improving
            it for the tutor community while completing my studies.
          </p>

          <div className="mt-5 rounded-2xl border border-line bg-canvas p-4">
            <p className="text-center text-sm font-bold">Support through GCash</p>
            <p className="mt-1 text-center text-xs leading-5 text-muted">
              Scan the QR code with your GCash app. Any amount is appreciated, but never expected.
            </p>
            <div className="mx-auto mt-4 flex min-h-[250px] w-full max-w-[280px] items-center justify-center rounded-xl border border-line bg-white p-3">
              {qrUnavailable ? (
                <p className="px-4 text-center text-xs leading-5 text-slate-600">
                  The GCash QR image could not be loaded. Please try again later.
                </p>
              ) : (
                <img
                  src="/My_gcash.jpg"
                  alt="GCash donation QR code for voluntarily supporting EarnEd"
                  onError={() => setQrUnavailable(true)}
                  className="max-h-[270px] w-full object-contain"
                />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-brand-soft/70 px-4 py-3 text-center dark:bg-brand/10">
            <p className="text-xs font-semibold leading-5 text-brand-dark dark:text-brand">
              No subscriptions. No locked features. No pressure. EarnEd remains free for everyone.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}

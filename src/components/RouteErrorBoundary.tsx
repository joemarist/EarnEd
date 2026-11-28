import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = isRouteErrorResponse(error)
    ? (typeof error.data === "string" ? error.data : error.statusText || "The requested page could not be displayed.")
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred while opening this page.";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-10 text-ink">
      <section className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:p-8" role="alert">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" /></svg>
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted">Something went wrong</p>
        <h1 className="mt-2 font-display text-2xl font-bold">We couldn’t open this page</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Your account and saved information have not been changed by this display error. Try loading the page again, or return to your dashboard.</p>
        {import.meta.env.DEV && <p className="mt-4 break-words rounded-xl bg-soft p-3 text-left text-xs text-muted">{message}</p>}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-dark px-5 text-sm font-semibold text-white hover:bg-[#355f1d]">Reload page</button>
          <button type="button" onClick={() => navigate("/app", { replace: true })} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink hover:bg-soft">Go to dashboard</button>
        </div>
      </section>
    </main>
  );
}

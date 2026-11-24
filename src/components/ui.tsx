import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "light";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand-dark text-white shadow-sm hover:bg-[#355f1d]",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-soft",
        variant === "ghost" && "text-muted hover:bg-soft hover:text-ink",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "light" && "border border-white/70 bg-white text-brand-dark shadow-sm hover:bg-white/90",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const key = status?.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        key === "paid" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        key === "partial" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        key === "unpaid" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        key === "upcoming" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        !key && "bg-soft text-muted",
      )}
    >
      {children ?? status}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/10",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/10",
        props.className,
      )}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p style={{ color: "var(--color-brand-dark)" }} className="mb-1 text-xs font-bold uppercase tracking-[0.15em] dark:!text-brand">{eyebrow}</p>
        )}
        <h1 style={{ color: "var(--ink)" }} className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p style={{ color: "var(--muted)" }} className="mt-1 max-w-2xl text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

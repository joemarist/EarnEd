import { Link } from "react-router";
import { cn } from "../lib/utils";

export function Brand({
  compact = false,
  light = false,
  className,
}: {
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="EarnEd home"
    >
      <img src="/brand/earned-mark.png" alt="" className="h-9 w-9 object-contain" />
      {!compact && (
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-tight",
            light ? "text-white" : "text-ink",
          )}
        >
          EarnEd
        </span>
      )}
    </Link>
  );
}

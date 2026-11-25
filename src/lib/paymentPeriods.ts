export type PayPeriodSettings = {
  schedule: string;
  cutoff_day_of_week: number | null;
  cutoff_rule: string;
  pay_cycle_anchor_date: string | null;
};

export type GeneratedPayPeriod = {
  start: string;
  end: string;
};

function toUtcDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateString(value: Date) {
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Returns the configured pay period containing a Daily Log date.
 * Bi-weekly schedules require a one-time anchor: the first day of a known
 * 14-day cycle. All calculations use UTC calendar dates to avoid timezone drift.
 */
export function getPayPeriodForDate(
  logDate: string,
  settings: PayPeriodSettings,
): GeneratedPayPeriod | null {
  if (!logDate) return null;

  const date = toUtcDate(logDate);
  const schedule = settings.schedule.trim().toLowerCase();

  if (schedule === "weekly") {
    const cutoffDay = settings.cutoff_day_of_week ?? 7; // Monday=1 ... Sunday=7
    const weekday = date.getUTCDay() || 7;

    // A log belongs to the pay period that ends on the next configured
    // cutoff day (or today when the log itself is on the cutoff day).
    // Using the previous cutoff incorrectly moved Monday-Saturday logs
    // into the preceding week's period.
    const daysUntilCutoff = (cutoffDay - weekday + 7) % 7;
    const end = addDays(date, daysUntilCutoff);

    return {
      start: toDateString(addDays(end, -6)),
      end: toDateString(end),
    };
  }

  if (schedule === "bi-weekly" || schedule === "biweekly") {
    if (!settings.pay_cycle_anchor_date) return null;
    const anchor = toUtcDate(settings.pay_cycle_anchor_date);
    const cycleOffset = Math.floor(daysBetween(anchor, date) / 14) * 14;
    const start = addDays(anchor, cycleOffset);
    return {
      start: toDateString(start),
      end: toDateString(addDays(start, 13)),
    };
  }

  if (schedule === "semi-monthly" || schedule === "semimonthly") {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    if (date.getUTCDate() <= 15) {
      return {
        start: toDateString(new Date(Date.UTC(year, month, 1))),
        end: toDateString(new Date(Date.UTC(year, month, 15))),
      };
    }
    return {
      start: toDateString(new Date(Date.UTC(year, month, 16))),
      end: toDateString(new Date(Date.UTC(year, month + 1, 0))),
    };
  }

  // Monthly schedules always use one complete calendar month.
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    start: toDateString(new Date(Date.UTC(year, month, 1))),
    end: toDateString(new Date(Date.UTC(year, month + 1, 0))),
  };
}

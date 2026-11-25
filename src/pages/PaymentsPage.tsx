import {
  AlertCircle,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components/ui";
import { getPayPeriodForDate } from "../lib/paymentPeriods";
import { supabase } from "../lib/supabase";
import { downloadText } from "../lib/utils";

type Workplace = {
  id: string;
  name: string;
  currency: string;
  archived: boolean;
  schedule: string;
  cutoff_rule: string;
  cutoff_day_of_week: number | null;
  pay_cycle_anchor_date: string | null;
  payday_type: "day_of_week" | "day_of_month" | "days_after_cutoff" | "no_fixed_date";
  payday_day_of_week: number | null;
  payday_day_of_month: number | null;
  payday_offset_days: number | null;
};

type DailyLog = {
  id: string;
  workplace_id: string | null;
  workplace: string;
  log_date: string;
  classes: number;
  rate_per_class: number;
  income: number;
};

type Payment = {
  id: string;
  workplace_id: string | null;
  workplace_name: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
};

type PeriodSummary = {
  key: string;
  workplaceId: string | null;
  workplace: string;
  currency: string;
  start: string;
  end: string;
  dueDate: string;
  expected: number;
  received: number;
  payments: Payment[];
  balance: number;
  status: "Paid" | "Partial" | "Unpaid" | "Upcoming";
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }
}

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function displayDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function sameWorkplace(
  item: { workplace_id: string | null; workplace_name?: string; workplace?: string },
  workplace: Workplace,
) {
  return item.workplace_id === workplace.id ||
    (!item.workplace_id && (item.workplace_name ?? item.workplace) === workplace.name);
}

function addDateDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getPaymentDueDate(periodEnd: string, workplace: Workplace) {
  const [year, month, day] = periodEnd.split("-").map(Number);
  const endDate = new Date(Date.UTC(year, month - 1, day));

  if (workplace.payday_type === "days_after_cutoff") {
    return addDateDays(periodEnd, Math.max(workplace.payday_offset_days ?? 0, 0));
  }

  if (workplace.payday_type === "day_of_week") {
    const targetDay = workplace.payday_day_of_week ?? 5;
    const currentDay = endDate.getUTCDay() || 7;
    let offset = (targetDay - currentDay + 7) % 7;
    if (offset === 0) offset = 7;
    return addDateDays(periodEnd, offset);
  }

  if (workplace.payday_type === "day_of_month") {
    const targetDay = workplace.payday_day_of_month ?? 15;
    const dueMonth = targetDay >= day ? month - 1 : month;
    const dueYear = year + Math.floor(dueMonth / 12);
    const normalizedMonth = (dueMonth + 12) % 12;
    const lastDay = new Date(Date.UTC(dueYear, normalizedMonth + 1, 0)).getUTCDate();
    return [
      dueYear,
      String(normalizedMonth + 1).padStart(2, "0"),
      String(Math.min(targetDay, lastDay)).padStart(2, "0"),
    ].join("-");
  }

  return periodEnd;
}

function buildPeriodSummaries(
  logs: DailyLog[],
  payments: Payment[],
  workplaces: Workplace[],
): PeriodSummary[] {
  const groups = new Map<string, PeriodSummary>();
  const getGroup = (
    workplace: Workplace,
    start: string,
    end: string,
  ) => {
    const key = [workplace.id, start, end].join("|");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        workplaceId: workplace.id,
        workplace: workplace.name,
        currency: workplace.currency || "USD",
        start,
        end,
        dueDate: getPaymentDueDate(end, workplace),
        expected: 0,
        received: 0,
        payments: [],
        balance: 0,
        status: "Unpaid",
      });
    }
    return groups.get(key)!;
  };

  for (const log of logs) {
    // A saved Daily Log only qualifies for a pay period when it records
    // at least one completed class. Empty/zero-class entries must not create
    // otherwise misleading payment periods.
    if (Number(log.classes ?? 0) <= 0) continue;

    const workplace = workplaces.find((item) =>
      item.id === log.workplace_id || (!log.workplace_id && item.name === log.workplace),
    );
    if (!workplace) continue;

    const scheduled = getPayPeriodForDate(log.log_date, workplace);
    if (!scheduled) {
      // A bi-weekly workplace may not have its one-time anchor configured yet.
      // Still calculate historical periods that already have saved payment dates.
      const legacyPayment = payments.find((payment) =>
        sameWorkplace(payment, workplace) &&
        log.log_date >= payment.period_start &&
        log.log_date <= payment.period_end,
      );
      if (legacyPayment) {
        getGroup(workplace, legacyPayment.period_start, legacyPayment.period_end).expected +=
          Math.max(Number(log.income ?? 0), 0);
      }
      continue;
    }

    // Preserve existing manually-entered ranges. New periods are split around
    // legacy ranges so an automatic period can never overlap an existing one.
    const overlappingPayments = payments
      .filter((payment) =>
        sameWorkplace(payment, workplace) &&
        payment.period_start <= scheduled.end &&
        payment.period_end >= scheduled.start,
      )
      .sort((a, b) => a.period_start.localeCompare(b.period_start));

    const coveringPayment = overlappingPayments.find((payment) =>
      log.log_date >= payment.period_start && log.log_date <= payment.period_end,
    );

    let start = scheduled.start;
    let end = scheduled.end;

    if (coveringPayment) {
      start = coveringPayment.period_start;
      end = coveringPayment.period_end;
    } else if (overlappingPayments.length > 0) {
      const previous = overlappingPayments
        .filter((payment) => payment.period_end < log.log_date)
        .sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
      const next = overlappingPayments
        .filter((payment) => payment.period_start > log.log_date)
        .sort((a, b) => a.period_start.localeCompare(b.period_start))[0];

      if (previous) start = addDateDays(previous.period_end, 1);
      if (next) end = addDateDays(next.period_start, -1);
      if (start > end || log.log_date < start || log.log_date > end) continue;
    }

    getGroup(workplace, start, end).expected += Math.max(Number(log.income ?? 0), 0);
  }

  for (const payment of payments) {
    const workplace = workplaces.find((item) => item.id === payment.workplace_id) ??
      workplaces.find((item) => !payment.workplace_id && item.name === payment.workplace_name);
    if (!workplace) continue;

    // Attach saved payments only to a period that was generated from at least
    // one qualifying Daily Log. Do not create an automatic period from a
    // payment record alone when no class entry exists for that workplace.
    const key = [workplace.id, payment.period_start, payment.period_end].join("|");
    const group = groups.get(key);
    if (!group) continue;

    group.received += Number(payment.amount ?? 0);
    group.payments.push(payment);
  }

  return Array.from(groups.values())
    .map((group) => {
      const balance = Math.max(group.expected - group.received, 0);
      const status: PeriodSummary["status"] =
        group.expected > 0 && balance <= 0.005
          ? "Paid"
          : group.received > 0
            ? "Partial"
            : group.dueDate > todayLocal()
              ? "Upcoming"
              : "Unpaid";
      return { ...group, balance, status };
    })
    .sort((a, b) =>
      b.end.localeCompare(a.end) || a.workplace.localeCompare(b.workplace),
    );
}

export function PaymentsPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPeriods, setExpandedPeriods] = useState<string[]>([]);
  const [recordingPeriod, setRecordingPeriod] = useState<PeriodSummary | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setPageError("");

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session?.user) {
          throw new Error("Please sign in to view your payment records.");
        }

        const [workplaceResult, logResult, paymentResult] = await Promise.all([
          supabase
            .from("workplaces")
            .select("id, name, currency, archived, schedule, cutoff_rule, cutoff_day_of_week, pay_cycle_anchor_date, payday_type, payday_day_of_week, payday_day_of_month, payday_offset_days")
            .eq("user_id", sessionData.session.user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_logs")
            .select("id, workplace_id, workplace, log_date, classes, rate_per_class, income")
            .eq("user_id", sessionData.session.user.id)
            .order("log_date", { ascending: true }),
          supabase
            .from("payments")
            .select("id, workplace_id, workplace_name, period_start, period_end, amount, currency, payment_date, payment_method, reference_number, notes")
            .eq("user_id", sessionData.session.user.id)
            .order("payment_date", { ascending: false }),
        ]);

        if (workplaceResult.error) throw new Error(workplaceResult.error.message);
        if (logResult.error) throw new Error(logResult.error.message);
        if (paymentResult.error) throw new Error(paymentResult.error.message);

        if (active) {
          setWorkplaces((workplaceResult.data ?? []) as Workplace[]);
          setLogs((logResult.data ?? []) as DailyLog[]);
          setPayments((paymentResult.data ?? []) as Payment[]);
        }
      } catch (error) {
        if (active) {
          setPageError(error instanceof Error ? error.message : "We could not load your payment data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const periodSummaries = useMemo(
    () => buildPeriodSummaries(logs, payments, workplaces),
    [logs, payments, workplaces],
  );

  const filteredPeriods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return periodSummaries.filter((item) => {
      const matchesWorkplace = selected === "all" || item.workplaceId === selected;
      const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
      const matchesSearch = !query ||
        item.workplace.toLowerCase().includes(query) ||
        item.payments.some((payment) =>
          [payment.reference_number, payment.payment_method, payment.notes]
            .some((value) => value?.toLowerCase().includes(query)),
        );
      return matchesWorkplace && matchesStatus && matchesSearch;
    });
  }, [periodSummaries, selected, statusFilter, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [selected, statusFilter, searchTerm]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredPeriods.length / pageSize));
  const paginatedPeriods = filteredPeriods.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const nextDuePeriods = useMemo(() => {
    const byWorkplace = new Map<string, PeriodSummary>();
    for (const period of periodSummaries) {
      if (!period.workplaceId || period.balance <= 0.005 || period.dueDate > todayLocal()) continue;
      const current = byWorkplace.get(period.workplaceId);
      if (!current || period.start < current.start) byWorkplace.set(period.workplaceId, period);
    }
    return Array.from(byWorkplace.values()).sort((a, b) => a.workplace.localeCompare(b.workplace));
  }, [periodSummaries]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { earned: number; received: number; outstanding: number }>();
    const add = (currency: string, field: "earned" | "received" | "outstanding", value: number) => {
      const current = totals.get(currency) ?? { earned: 0, received: 0, outstanding: 0 };
      current[field] += value;
      totals.set(currency, current);
    };

    for (const log of logs) {
      if (Number(log.classes ?? 0) <= 0) continue;
      const currency =
        workplaces.find((item) => item.id === log.workplace_id)?.currency ??
        workplaces.find((item) => !log.workplace_id && item.name === log.workplace)?.currency ??
        "USD";
      add(currency, "earned", Math.max(Number(log.income ?? 0), 0));
    }
    for (const payment of payments) add(payment.currency || "USD", "received", Number(payment.amount ?? 0));
    for (const period of periodSummaries) add(period.currency, "outstanding", period.balance);

    return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [logs, payments, workplaces, periodSummaries]);

  const earnedTotal = totalsByCurrency.map(([currency, totals]) => formatMoney(totals.earned, currency));
  const receivedTotal = totalsByCurrency.map(([currency, totals]) => formatMoney(totals.received, currency));
  const outstandingTotal = totalsByCurrency.map(([currency, totals]) => formatMoney(totals.outstanding, currency));

  function openRecordModal(period: PeriodSummary) {
    setRecordingPeriod(period);
    setAmount("");
    setSaveError("");
  }

  async function savePayment() {
    if (!recordingPeriod) return;
    const workplace = workplaces.find((item) => item.id === recordingPeriod.workplaceId);
    if (!workplace) {
      setSaveError("The workplace for this payment period could not be found.");
      return;
    }

    const numericAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setSaveError("Enter an amount greater than zero.");
      return;
    }
    if (numericAmount > recordingPeriod.balance + 0.005) {
      setSaveError("The amount is higher than the remaining balance of " +
        formatMoney(recordingPeriod.balance, recordingPeriod.currency) + ".");
      return;
    }
    if (recordingPeriod.end > todayLocal()) {
      setSaveError("This workplace's expected payday has not arrived yet.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const signedInUser = sessionData.session?.user;
      if (sessionError || !signedInUser) throw new Error("You must be signed in to record a payment.");

      // Recheck the exact generated period immediately before saving.
      const [latestLogsResult, latestPaymentsResult] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("id, workplace_id, workplace, log_date, classes, income")
          .eq("user_id", signedInUser.id)
          .gte("log_date", recordingPeriod.start)
          .lte("log_date", recordingPeriod.end),
        supabase
          .from("payments")
          .select("id, amount, workplace_id, workplace_name, period_start, period_end")
          .eq("user_id", signedInUser.id)
          .eq("period_start", recordingPeriod.start)
          .eq("period_end", recordingPeriod.end),
      ]);
      if (latestLogsResult.error) throw new Error(latestLogsResult.error.message);
      if (latestPaymentsResult.error) throw new Error(latestPaymentsResult.error.message);

      const latestLogs = (latestLogsResult.data ?? []) as DailyLog[];
      const latestPayments = (latestPaymentsResult.data ?? []) as Payment[];
      const latestExpected = latestLogs.reduce((total, log) =>
        sameWorkplace(log, workplace) && Number(log.classes ?? 0) > 0
          ? total + Math.max(Number(log.income ?? 0), 0)
          : total, 0);
      const latestReceived = latestPayments.reduce((total, payment) =>
        sameWorkplace(payment, workplace) ? total + Number(payment.amount ?? 0) : total, 0);
      const latestRemaining = Math.max(latestExpected - latestReceived, 0);

      if (latestExpected <= 0) throw new Error("No Daily Logs income exists in this generated pay period.");
      if (latestRemaining <= 0.005) throw new Error("This pay period has already been fully paid.");
      if (numericAmount > latestRemaining + 0.005) {
        throw new Error("The remaining balance changed to " +
          formatMoney(latestRemaining, workplace.currency) + ". Please refresh and try again.");
      }

      const { error } = await supabase.from("payments").insert({
        user_id: signedInUser.id,
        workplace_id: workplace.id,
        workplace_name: workplace.name,
        period_start: recordingPeriod.start,
        period_end: recordingPeriod.end,
        amount: numericAmount,
        currency: workplace.currency || "USD",
        payment_date: todayLocal(),
        payment_method: null,
        reference_number: null,
        notes: null,
      });

      if (error) throw new Error(error.message);

      setRecordingPeriod(null);
      setAmount("");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We could not save this payment.");
    } finally {
      setSaving(false);
    }
  }

  const csv = [
    ["Workplace", "Period start", "Period end", "Currency", "Expected", "Received", "Balance", "Status", "Payment dates"].map(csvCell).join(","),
    ...filteredPeriods.map((item) =>
      [
        item.workplace,
        item.start,
        item.end,
        item.currency,
        item.expected.toFixed(2),
        item.received.toFixed(2),
        item.balance.toFixed(2),
        item.status,
        item.payments.map((payment) => payment.payment_date).join("; "),
      ].map(csvCell).join(","),
    ),
  ].join("\n");

  const kpiCards: Array<{ label: string; values: string[]; detail: string; Icon: typeof TrendingUp; warning: boolean }> = [
    { label: "Total earned from logs", values: earnedTotal, detail: "Uses saved Daily Logs income and historical class rates", Icon: TrendingUp, warning: false },
    { label: "Payments received", values: receivedTotal, detail: payments.length + " payment record" + (payments.length === 1 ? "" : "s") + " saved", Icon: CalendarCheck, warning: false },
    { label: "Outstanding pay", values: outstandingTotal, detail: "Includes generated periods with unpaid balances", Icon: AlertCircle, warning: true },
  ];

  if (loading) return <div className="p-6 text-sm text-muted">Loading payments...</div>;

  const workplacesMissingAnchor = workplaces.filter((item) =>
    item.schedule.toLowerCase() === "bi-weekly" && !item.pay_cycle_anchor_date,
  );

  return (
    <>
      <PageHeader
        eyebrow="Reconciliation"
        title="Payments"
        description="Pay periods are generated from each workplace's schedule. Record the amount received—EarnEd handles the dates."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadText("earned-payments.csv", csv)}
              disabled={filteredPeriods.length === 0}
            >
              <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={() => nextDuePeriods[0] && openRecordModal(nextDuePeriods[0])} disabled={nextDuePeriods.length === 0}>
              <Plus size={16} /> Record next payment
            </Button>
          </div>
        }
      />

      {pageError && (
        <Card className="mb-5 border-red-200 p-4 dark:border-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{pageError}</p>
              <Button className="mt-3" variant="secondary" onClick={() => setReloadKey((value) => value + 1)}>
                <RefreshCw size={14} /> Try again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {workplacesMissingAnchor.length > 0 && (
        <Card className="mb-5 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Complete your bi-weekly schedule setup</p>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
                {workplacesMissingAnchor.map((item) => item.name).join(", ")} needs a one-time first-day-of-cycle date in Workplace Settings before EarnEd can generate accurate 14-day periods.
              </p>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {kpiCards.map(({ label, values, detail, Icon, warning }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{label}</p>
                <div className="mt-2 space-y-1">
                  {values.length > 0 ? values.map((value, index) => <p key={label + index} className="text-xl font-bold">{value}</p>) : <p className="text-2xl font-bold">—</p>}
                </div>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${warning ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-brand-soft text-brand-dark"}`}>
                <Icon size={19} />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">{detail}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Pay-period reconciliation</h2>
            <p className="text-xs text-muted">Periods are calculated from Daily Logs and each workplace's saved payment schedule.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search workplace or reference" className="pl-9" />
            </label>
            <Select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full">
              <option value="all">All workplaces</option>
              {workplaces.map((item) => <option key={item.id} value={item.id}>{item.name}{item.archived ? " (archived)" : ""}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full">
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="upcoming">Upcoming</option>
            </Select>
          </div>
        </div>

        {filteredPeriods.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarCheck className="mx-auto text-muted" size={28} />
            <h3 className="mt-3 font-semibold">{periodSummaries.length === 0 ? "No generated pay periods yet" : "No matching pay periods"}</h3>
            <p className="mx-auto mt-1 max-w-lg text-sm text-muted">
              {periodSummaries.length === 0
                ? "Add Daily Logs to let EarnEd calculate your expected pay automatically. Check that each workplace has a complete payment schedule."
                : "Try changing your search, workplace, or status filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Workplace</th>
                  <th className="px-4 py-3">Pay period</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Balance owed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedPeriods.map((item) => (
                  <Fragment key={item.key}>
                    <tr className="hover:bg-soft/60">
                      <td className="px-5 py-4">
                        <button type="button" className="inline-flex items-center gap-2 text-left font-semibold hover:text-brand" onClick={() => setExpandedPeriods((previous) => previous.includes(item.key) ? previous.filter((key) => key !== item.key) : [...previous, item.key])}>
                          {expandedPeriods.includes(item.key) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{item.workplace}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-muted">{displayDate(item.start)} – {displayDate(item.end)}<span className="mt-1 block text-xs text-muted">Due {displayDate(item.dueDate)}</span></td>
                      <td className="px-4 py-4">{formatMoney(item.expected, item.currency)}</td>
                      <td className="px-4 py-4">{formatMoney(item.received, item.currency)}</td>
                      <td className={`px-4 py-4 font-bold ${item.balance > 0.005 ? "text-amber-600" : "text-emerald-600"}`}>{formatMoney(item.balance, item.currency)}</td>
                      <td className="px-4 py-4"><Badge status={item.status.toLowerCase()}>{item.status}</Badge></td>
                      <td className="px-4 py-4">
                        {item.balance > 0.005 && item.dueDate <= todayLocal() && item.expected > 0 ? (
                          <Button className="min-h-9 px-3 text-xs" onClick={() => openRecordModal(item)}>Record amount</Button>
                        ) : <span className="text-xs text-muted">—</span>}
                      </td>
                    </tr>
                    {expandedPeriods.includes(item.key) && (
                      <tr className="bg-soft/50">
                        <td colSpan={7} className="px-5 py-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Payment entries ({item.payments.length})</p>
                          {item.payments.length === 0 ? (
                            <p className="text-xs text-muted">No payment has been recorded for this period yet.</p>
                          ) : (
                            <div className="grid gap-2">
                              {item.payments.slice().sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map((payment) => (
                                <div key={payment.id} className="grid gap-1 rounded-lg border border-line bg-surface p-3 text-xs sm:grid-cols-4">
                                  <span><strong>Date:</strong> {displayDate(payment.payment_date)}</span>
                                  <span><strong>Amount:</strong> {formatMoney(Number(payment.amount), payment.currency)}</span>
                                  <span><strong>Method:</strong> {payment.payment_method || "—"}</span>
                                  <span><strong>Reference:</strong> {payment.reference_number || "—"}</span>
                                  {payment.notes && <span className="sm:col-span-4"><strong>Notes:</strong> {payment.notes}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredPeriods.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm sm:flex-row">
            <p className="text-xs text-muted">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPeriods.length)} of {filteredPeriods.length} pay periods</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</Button>
              <span className="text-xs text-muted">Page {currentPage} of {pageCount}</span>
              <Button variant="secondary" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-5 border-brand/15 bg-brand-soft/40 p-5 dark:bg-brand/5">
        <div className="flex items-start gap-3">
          <CalendarCheck className="mt-0.5 shrink-0 text-brand" size={19} />
          <div>
            <h3 className="font-bold">Automatic payment periods</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              EarnEd groups Daily Logs using each workplace's saved schedule: weekly cut-off day, a configured 14-day cycle, semi-monthly (1–15 and 16–month-end), or calendar month. When you record a payment, the received date is set to today and the period dates are saved automatically. Partial payments continue to use the same generated period.
            </p>
          </div>
        </div>
      </Card>

      {recordingPeriod && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4"
          onMouseDown={(event) => !saving && event.target === event.currentTarget && setRecordingPeriod(null)}
        >
          <Card className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Record payment</h2>
                <p className="mt-1 text-sm text-muted">The period is generated from the workplace schedule.</p>
              </div>
              <button type="button" aria-label="Close payment form" onClick={() => !saving && setRecordingPeriod(null)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-soft">×</button>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-soft/60 p-3">
              <p className="font-semibold">{recordingPeriod.workplace}</p>
              <p className="mt-1 text-xs text-muted">{displayDate(recordingPeriod.start)} – {displayDate(recordingPeriod.end)}</p><p className="mt-1 text-xs text-muted">Expected payday: {displayDate(recordingPeriod.dueDate)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted">Expected</p><p className="mt-1 font-semibold">{formatMoney(recordingPeriod.expected, recordingPeriod.currency)}</p></div>
                <div><p className="text-xs text-muted">Already received</p><p className="mt-1 font-semibold">{formatMoney(recordingPeriod.received, recordingPeriod.currency)}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm text-muted">Remaining balance</span>
                <strong className="text-lg text-amber-600">{formatMoney(recordingPeriod.balance, recordingPeriod.currency)}</strong>
              </div>
            </div>

            <label className="mt-4 block text-sm font-semibold">
              Amount received
              <Input
                autoFocus
                type="number"
                min="0.01"
                max={recordingPeriod.balance.toFixed(2)}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="mt-2"
              />
              <span className="mt-1 block text-xs font-normal text-muted">Currency: {recordingPeriod.currency} · Date received is automatically set to today.</span>
            </label>

            {Number(amount) > recordingPeriod.balance + 0.005 && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                This amount is higher than the remaining balance.
              </p>
            )}
            {saveError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{saveError}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setRecordingPeriod(null)} disabled={saving}>Cancel</Button>
              <Button onClick={savePayment} disabled={saving || !amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > recordingPeriod.balance + 0.005}>
                {saving ? "Saving..." : "Save payment"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

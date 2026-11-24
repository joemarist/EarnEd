import { AlertCircle, CalendarCheck, ChevronDown, ChevronRight, Download, Plus, RefreshCw, Search, TrendingUp } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components/ui";
import { supabase } from "../lib/supabase";
import { downloadText } from "../lib/utils";

type Workplace = {
  id: string;
  name: string;
  currency: string;
  archived: boolean;
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
  expected: number;
  received: number;
  payments: Payment[];
  balance: number;
  status: "Paid" | "Partial" | "Unpaid";
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
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

function calculateAllocatedPayments(
  logs: DailyLog[],
  payments: Payment[],
  workplace: Workplace
) {
  const workplaceLogs = logs
    .filter((log) =>
      log.workplace_id === workplace.id ||
      (!log.workplace_id && log.workplace === workplace.name)
    )
    .slice()
    .sort((a, b) => a.log_date.localeCompare(b.log_date) || a.id.localeCompare(b.id));

  const remainingByLog = new Map(
    workplaceLogs.map((log) => [log.id, Math.max(Number(log.income ?? 0), 0)])
  );
  const allocatedByLog = new Map<string, number>();

  // Earlier recorded pay periods claim their covered log income first.
  const orderedPayments = payments
    .filter((payment) =>
      payment.workplace_id === workplace.id ||
      (!payment.workplace_id && payment.workplace_name === workplace.name)
    )
    .slice()
    .sort((a, b) =>
      a.period_start.localeCompare(b.period_start) ||
      a.period_end.localeCompare(b.period_end) ||
      a.payment_date.localeCompare(b.payment_date)
    );

  for (const payment of orderedPayments) {
    let unallocated = Math.max(Number(payment.amount ?? 0), 0);
    for (const log of workplaceLogs) {
      if (log.log_date < payment.period_start || log.log_date > payment.period_end) continue;
      if (unallocated <= 0.005) break;

      const logRemaining = remainingByLog.get(log.id) ?? 0;
      if (logRemaining <= 0.005) continue;

      const allocated = Math.min(logRemaining, unallocated);
      remainingByLog.set(log.id, logRemaining - allocated);
      allocatedByLog.set(log.id, (allocatedByLog.get(log.id) ?? 0) + allocated);
      unallocated -= allocated;
    }
  }

  return { allocatedByLog, remainingByLog };
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
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [workplaceId, setWorkplaceId] = useState("");
  const [periodStart, setPeriodStart] = useState(todayLocal());
  const [periodEnd, setPeriodEnd] = useState(todayLocal());
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayLocal());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

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
            .select("id, name, currency, archived")
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
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedWorkplace = workplaces.find((item) => item.id === workplaceId);
  const expectedForSelectedPeriod = useMemo(() => {
    if (!selectedWorkplace || !periodStart || !periodEnd || periodEnd < periodStart) return 0;

    return logs.reduce((total, log) => {
      const belongsToWorkplace =
        log.workplace_id === selectedWorkplace.id ||
        (!log.workplace_id && log.workplace === selectedWorkplace.name);
      const inPeriod = log.log_date >= periodStart && log.log_date <= periodEnd;
      return belongsToWorkplace && inPeriod ? total + Number(log.income ?? 0) : total;
    }, 0);
  }, [logs, selectedWorkplace, periodStart, periodEnd]);

  const receivedForSelectedPeriod = useMemo(() => {
    if (!selectedWorkplace || !periodStart || !periodEnd || periodEnd < periodStart) return 0;
    const { allocatedByLog } = calculateAllocatedPayments(logs, payments, selectedWorkplace);
    return logs.reduce((total, log) => {
      const belongsToWorkplace =
        log.workplace_id === selectedWorkplace.id ||
        (!log.workplace_id && log.workplace === selectedWorkplace.name);
      const inPeriod = log.log_date >= periodStart && log.log_date <= periodEnd;
      return belongsToWorkplace && inPeriod
        ? total + (allocatedByLog.get(log.id) ?? 0)
        : total;
    }, 0);
  }, [logs, payments, selectedWorkplace, periodStart, periodEnd]);

  const remainingForSelectedPeriod = Math.max(expectedForSelectedPeriod - receivedForSelectedPeriod, 0);
  const periodAlreadyPaid = expectedForSelectedPeriod > 0 && remainingForSelectedPeriod <= 0.005;

  const periodSummaries = useMemo(() => {
    const groups = new Map<string, PeriodSummary>();

    for (const payment of payments) {
      const workplace = workplaces.find((item) => item.id === payment.workplace_id);
      const workplaceName = workplace?.name ?? payment.workplace_name;
      const key = [
        payment.workplace_id ?? payment.workplace_name,
        payment.period_start,
        payment.period_end,
      ].join("|");

      if (!groups.has(key)) {
        const expected = logs.reduce((total, log) => {
          const sameWorkplace =
            (payment.workplace_id && log.workplace_id === payment.workplace_id) ||
            ((!payment.workplace_id || !log.workplace_id) && log.workplace === payment.workplace_name);
          const inPeriod =
            log.log_date >= payment.period_start && log.log_date <= payment.period_end;
          return sameWorkplace && inPeriod ? total + Number(log.income ?? 0) : total;
        }, 0);

        groups.set(key, {
          key,
          workplaceId: payment.workplace_id,
          workplace: workplaceName,
          currency: payment.currency || workplace?.currency || "USD",
          start: payment.period_start,
          end: payment.period_end,
          expected,
          received: 0,
          payments: [],
          balance: 0,
          status: "Unpaid",
        });
      }

      const group = groups.get(key)!;
      group.received += Number(payment.amount ?? 0);
      group.payments.push(payment);
    }

    return Array.from(groups.values())
      .map((group) => {
        const balance = Math.max(group.expected - group.received, 0);
        const status =
          group.expected > 0 && balance <= 0
            ? "Paid"
            : group.received > 0
              ? "Partial"
              : "Unpaid";
        return { ...group, balance, status } as PeriodSummary;
      })
      .sort((a, b) => b.end.localeCompare(a.end));
  }, [payments, logs, workplaces]);

  const filteredPeriods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return periodSummaries.filter((item) => {
      const matchesWorkplace = selected === "all" || item.workplaceId === selected;
      const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
      const matchesSearch = !query || item.workplace.toLowerCase().includes(query) || item.payments.some((payment) => [payment.reference_number, payment.payment_method, payment.notes].some((value) => value?.toLowerCase().includes(query)));
      return matchesWorkplace && matchesStatus && matchesSearch;
    });
  }, [periodSummaries, selected, statusFilter, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [selected, statusFilter, searchTerm]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredPeriods.length / pageSize));
  const paginatedPeriods = filteredPeriods.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { earned: number; received: number; outstanding: number }>();
    const add = (currency: string, field: "earned" | "received" | "outstanding", value: number) => {
      const current = totals.get(currency) ?? { earned: 0, received: 0, outstanding: 0 };
      current[field] += value;
      totals.set(currency, current);
    };

    for (const log of logs) {
      const currency =
        workplaces.find((item) => item.id === log.workplace_id)?.currency ??
        workplaces.find((item) => item.name === log.workplace)?.currency ??
        "USD";
      add(currency, "earned", Number(log.income ?? 0));
    }
    for (const payment of payments) {
      add(payment.currency || "USD", "received", Number(payment.amount ?? 0));
    }
    for (const period of periodSummaries) {
      add(period.currency, "outstanding", period.balance);
    }

    return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [logs, payments, workplaces, periodSummaries]);

  const earnedTotal = totalsByCurrency.map(([currency, totals]) =>
    formatMoney(totals.earned, currency)
  );
  const receivedTotal = totalsByCurrency.map(([currency, totals]) =>
    formatMoney(totals.received, currency)
  );
  const outstandingTotal = totalsByCurrency.map(([currency, totals]) =>
    formatMoney(totals.outstanding, currency)
  );

  function openRecordModal() {
    setWorkplaceId(workplaces.find((item) => !item.archived)?.id ?? workplaces[0]?.id ?? "");
    setPeriodStart(todayLocal());
    setPeriodEnd(todayLocal());
    setAmount("");
    setPaymentDate(todayLocal());
    setPaymentMethod("");
    setReferenceNumber("");
    setNotes("");
    setSaveError("");
    setRecording(true);
  }

  async function savePayment() {
    if (!workplaceId || !selectedWorkplace) {
      setSaveError("Please select a workplace.");
      return;
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setSaveError("Please enter a valid pay-period date range.");
      return;
    }
    const numericAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setSaveError("Enter an amount greater than zero.");
      return;
    }
    if (!paymentDate) {
      setSaveError("Please select the date you received the payment.");
      return;
    }
    if (expectedForSelectedPeriod <= 0) {
      setSaveError("There is no recorded Daily Logs income for this workplace and date range. Check the period dates.");
      return;
    }
    if (periodAlreadyPaid) {
      setSaveError("This pay period is already fully paid. You cannot add another payment to it.");
      return;
    }
    if (numericAmount > remainingForSelectedPeriod + 0.005) {
      setSaveError("The amount is higher than the remaining balance of " + formatMoney(remainingForSelectedPeriod, selectedWorkplace.currency) + ". Please check the amount.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const signedInUser = sessionData.session?.user;
      if (sessionError || !signedInUser) throw new Error("You must be signed in to record a payment.");

      // Recheck the latest saved logs and payments immediately before inserting.
      // This also includes legacy records linked by workplace name instead of workplace_id.
      const [latestLogsResult, latestPaymentsResult] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("id, workplace_id, workplace, log_date, classes, rate_per_class, income")
          .eq("user_id", signedInUser.id)
          .gte("log_date", periodStart)
          .lte("log_date", periodEnd),
        supabase
          .from("payments")
          .select("id, amount, workplace_id, workplace_name, period_start, period_end, payment_date, currency, payment_method, reference_number, notes")
          .eq("user_id", signedInUser.id)
          .lte("period_start", periodEnd)
          .gte("period_end", periodStart),
      ]);
      if (latestLogsResult.error) throw new Error(latestLogsResult.error.message);
      if (latestPaymentsResult.error) throw new Error(latestPaymentsResult.error.message);

      const latestLogs = (latestLogsResult.data ?? []) as DailyLog[];
      const latestPayments = (latestPaymentsResult.data ?? []) as Payment[];
      const latestExpected = latestLogs.reduce((total, log) => total + Number(log.income ?? 0), 0);
      const latestAllocated = calculateAllocatedPayments(latestLogs, latestPayments, selectedWorkplace);
      const latestReceived = latestLogs.reduce((total, log) =>
        total + (latestAllocated.allocatedByLog.get(log.id) ?? 0), 0);
      const latestRemaining = Math.max(latestExpected - latestReceived, 0);

      if (latestExpected <= 0) {
        throw new Error("No Daily Logs income exists for this workplace and pay period.");
      }
      if (latestRemaining <= 0.005) {
        throw new Error("This pay period has already been fully paid. No additional payment can be recorded.");
      }
      if (numericAmount > latestRemaining + 0.005) {
        throw new Error("This amount is higher than the updated remaining balance of " + formatMoney(latestRemaining, selectedWorkplace.currency) + ". Please refresh and check again.");
      }

      const { error } = await supabase.from("payments").insert({
        user_id: sessionData.session.user.id,
        workplace_id: selectedWorkplace.id,
        workplace_name: selectedWorkplace.name,
        period_start: periodStart,
        period_end: periodEnd,
        amount: numericAmount,
        currency: selectedWorkplace.currency || "USD",
        payment_date: paymentDate,
        payment_method: paymentMethod || null,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw new Error(error.message);

      setRecording(false);
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
      ].map(csvCell).join(",")
    ),
  ].join("\n");

  const kpiCards: Array<{ label: string; values: string[]; detail: string; Icon: typeof TrendingUp; warning: boolean }> = [
    { label: "Total earned from logs", values: earnedTotal, detail: "Uses the saved income and historical class rates", Icon: TrendingUp, warning: false },
    { label: "Payments received", values: receivedTotal, detail: payments.length + " payment record" + (payments.length === 1 ? "" : "s") + " saved", Icon: CalendarCheck, warning: false },
    { label: "Outstanding on recorded periods", values: outstandingTotal, detail: "Calculated only for pay periods with a recorded payment", Icon: AlertCircle, warning: true },
  ];
  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading payments...</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Reconciliation"
        title="Payments"
        description="Compare class income from Daily Logs with payments received from each workplace."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadText("earned-payments.csv", csv)}
              disabled={filteredPeriods.length === 0}
            >
              <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={openRecordModal} disabled={workplaces.length === 0}>
              <Plus size={16} /> Record payment
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
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${warning ? "bg-amber-100 text-amber-700 dark:bg-amber-950" : "bg-brand-soft text-brand-dark"}`}>
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
            <p className="text-xs text-muted">Each row compares Daily Logs within the saved date range against all payments recorded for that range.</p>
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
              <option value="all">All statuses</option><option value="paid">Paid</option><option value="partial">Partial</option>
            </Select>
          </div>
        </div>

        {filteredPeriods.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarCheck className="mx-auto text-muted" size={28} />
            <h3 className="mt-3 font-semibold">{periodSummaries.length === 0 ? "No payment periods recorded yet" : "No matching payment periods"}</h3>
            <p className="mx-auto mt-1 max-w-lg text-sm text-muted">
              {periodSummaries.length === 0 ? "Your earned income is already calculated from Daily Logs above. Record the first payment and its pay-period dates to start reconciling what was expected against what arrived." : "Try changing your search, workplace, or status filters."}
            </p>
            {workplaces.length > 0 && (
              <Button className="mt-4" onClick={openRecordModal}><Plus size={16} /> Record your first payment</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Workplace</th>
                  <th className="px-4 py-3">Pay period</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Latest payment</th>
                  <th className="px-4 py-3">Balance owed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedPeriods.map((item) => (
                  <Fragment key={item.key}>
                  <tr className="hover:bg-soft/60">
                    <td className="px-5 py-4"><button type="button" className="inline-flex items-center gap-2 text-left font-semibold hover:text-brand" onClick={() => setExpandedPeriods((previous) => previous.includes(item.key) ? previous.filter((key) => key !== item.key) : [...previous, item.key])}>{expandedPeriods.includes(item.key) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{item.workplace}</button></td>
                    <td className="px-4 py-4 text-muted">{displayDate(item.start)} – {displayDate(item.end)}</td>
                    <td className="px-4 py-4">{formatMoney(item.expected, item.currency)}</td>
                    <td className="px-4 py-4">{formatMoney(item.received, item.currency)}</td>
                    <td className="px-4 py-4 text-muted">{item.payments.length ? displayDate(item.payments.reduce((latest, payment) => payment.payment_date > latest ? payment.payment_date : latest, item.payments[0].payment_date)) : "—"}</td>
                    <td className={`px-4 py-4 font-bold ${item.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatMoney(item.balance, item.currency)}</td>
                    <td className="px-4 py-4"><Badge status={item.status.toLowerCase()}>{item.status}</Badge></td>
                  </tr>
                  {expandedPeriods.includes(item.key) && <tr key={item.key + "-details"} className="bg-soft/50"><td colSpan={7} className="px-5 py-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Payment entries ({item.payments.length})</p><div className="grid gap-2">{item.payments.slice().sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map((payment) => <div key={payment.id} className="grid gap-1 rounded-lg border border-line bg-surface p-3 text-xs sm:grid-cols-4"><span><strong>Date:</strong> {displayDate(payment.payment_date)}</span><span><strong>Amount:</strong> {formatMoney(Number(payment.amount), payment.currency)}</span><span><strong>Method:</strong> {payment.payment_method || "—"}</span><span><strong>Reference:</strong> {payment.reference_number || "—"}</span>{payment.notes && <span className="sm:col-span-4"><strong>Notes:</strong> {payment.notes}</span>}</div>)}</div></td></tr>}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredPeriods.length > 0 && <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm sm:flex-row"><p className="text-xs text-muted">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPeriods.length)} of {filteredPeriods.length} pay periods</p><div className="flex items-center gap-2"><Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</Button><span className="text-xs text-muted">Page {currentPage} of {pageCount}</span><Button variant="secondary" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</Button></div></div>}
      </Card>

      <Card className="mt-5 border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={19} />
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200">How reconciliation works</h3>
            <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-200/70">
              Choose the exact start and end dates shown by your workplace when recording a payment. Expected pay is summed from your Daily Logs for those dates. Payments are allocated to covered Daily Logs in date order, so a payment for a wider period also covers the dates inside it. Use one consistent pay-period range when recording partial payments; overlapping alternative ranges are not allowed.
            </p>
            <p className="mt-2 text-xs leading-5 text-amber-800/80 dark:text-amber-200/70">
              Period dates are entered explicitly rather than guessed from the schedule, because bi-weekly schedules need a confirmed cycle anchor date.
            </p>
          </div>
        </div>
      </Card>

      {recording && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onMouseDown={() => !saving && setRecording(false)}
        >
          <Card className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-b-none p-5 sm:rounded-2xl">
            <div onMouseDown={(event) => event.stopPropagation()}>
              <h2 className="text-xl font-bold">Record a payment</h2>
              <p className="mt-1 text-sm text-muted">This payment will be added to the selected workplace and pay period.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Workplace
                  <Select className="mt-2 w-full" value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)}>
                    <option value="">Select workplace</option>
                    {workplaces.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}{item.archived ? " (archived)" : ""}</option>
                    ))}
                  </Select>
                </label>

                <label className="text-sm font-semibold">
                  Pay period starts
                  <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2" />
                </label>
                <label className="text-sm font-semibold">
                  Pay period ends
                  <Input type="date" value={periodEnd} min={periodStart} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-2" />
                </label>

                <div className="rounded-xl bg-soft p-3 sm:col-span-2">
                  <p className="text-xs font-semibold text-muted">Expected from Daily Logs</p>
                  <p className="mt-1 text-lg font-bold">{selectedWorkplace ? formatMoney(expectedForSelectedPeriod, selectedWorkplace.currency) : "Select a workplace"}</p>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs"><span className="text-muted">Already received: {selectedWorkplace ? formatMoney(receivedForSelectedPeriod, selectedWorkplace.currency) : "—"}</span><strong className={periodAlreadyPaid ? "text-emerald-600" : "text-amber-600"}>{selectedWorkplace ? (periodAlreadyPaid ? "Fully paid" : "Remaining: " + formatMoney(remainingForSelectedPeriod, selectedWorkplace.currency)) : ""}</strong></div>
                  <p className="mt-1 text-xs text-muted">Based on saved class income between the dates above.</p>
                </div>

                <label className="text-sm font-semibold">
                  Amount received
                  <Input type="number" min="0.01" max={remainingForSelectedPeriod.toFixed(2)} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-2" disabled={periodAlreadyPaid || expectedForSelectedPeriod <= 0 || !periodStart || !periodEnd || periodEnd < periodStart} />
                  {selectedWorkplace && <span className="mt-1 block text-xs font-normal text-muted">Currency: {selectedWorkplace.currency} · Maximum allowed: {formatMoney(remainingForSelectedPeriod, selectedWorkplace.currency)}</span>}
                </label>
                <label className="text-sm font-semibold">
                  Date received
                  <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="mt-2" />
                </label>

                <label className="text-sm font-semibold">
                  Payment method (optional)
                  <Select className="mt-2 w-full" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option value="">Not specified</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Wise">Wise</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </Select>
                </label>
                <label className="text-sm font-semibold">
                  Reference number (optional)
                  <Input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} placeholder="Transaction ID" className="mt-2" />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Notes (optional)
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Add any useful payment details..." className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/10" />
                </label>
              </div>

              {periodAlreadyPaid && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">This pay period is already fully paid. Another payment cannot be added.</div>}
              {!periodAlreadyPaid && expectedForSelectedPeriod > 0 && Number(amount) > remainingForSelectedPeriod && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">That amount is higher than the remaining balance of {selectedWorkplace ? formatMoney(remainingForSelectedPeriod, selectedWorkplace.currency) : "—"}.</div>}
              {saveError && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{saveError}</div>}

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRecording(false)} disabled={saving}>Cancel</Button>
                <Button onClick={savePayment} disabled={saving || workplaces.length === 0 || periodAlreadyPaid || expectedForSelectedPeriod <= 0 || !periodStart || !periodEnd || periodEnd < periodStart || !amount.trim() || Number(amount) <= 0 || Number(amount) > remainingForSelectedPeriod + 0.005}>{saving ? "Saving..." : "Save payment"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

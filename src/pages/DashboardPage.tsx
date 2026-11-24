import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, PageHeader, Select } from "../components/ui";
import { supabase } from "../lib/supabase";

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
  notes: string | null;
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
};

type CurrencySummary = {
  currency: string;
  earned: number;
  received: number;
  outstanding: number;
  classes: number;
  monthly: Array<{ month: string; earned: number; received: number }>;
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
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

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
  });
}

function allocatePayments(logs: DailyLog[], payments: Payment[], workplace: Workplace) {
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
      const remaining = remainingByLog.get(log.id) ?? 0;
      if (remaining <= 0.005) continue;
      const allocated = Math.min(remaining, unallocated);
      remainingByLog.set(log.id, remaining - allocated);
      unallocated -= allocated;
    }
  }

  const outstanding = Array.from(remainingByLog.values()).reduce((sum, value) => sum + value, 0);
  return { outstanding };
}

export function DashboardPage() {
  const today = localDateKey(new Date());
  const currentMonth = monthKey(today);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workplaceFilter, setWorkplaceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      setLoading(true);
      setPageError("");
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error("Please sign in to view your dashboard.");
        }

        const [workplaceResult, logResult, paymentResult] = await Promise.all([
          supabase
            .from("workplaces")
            .select("id, name, currency, archived")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_logs")
            .select("id, workplace_id, workplace, log_date, classes, rate_per_class, income, notes")
            .eq("user_id", userData.user.id)
            .order("log_date", { ascending: false }),
          supabase
            .from("payments")
            .select("id, workplace_id, workplace_name, period_start, period_end, amount, currency, payment_date")
            .eq("user_id", userData.user.id)
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
          setPageError(error instanceof Error ? error.message : "We could not load your dashboard data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedWorkplaces = useMemo(
    () => workplaceFilter === "all"
      ? workplaces
      : workplaces.filter((workplace) => workplace.id === workplaceFilter),
    [workplaces, workplaceFilter]
  );

  const workplaceById = useMemo(
    () => new Map(workplaces.map((workplace) => [workplace.id, workplace])),
    [workplaces]
  );

  function getLogWorkplace(log: DailyLog) {
    return log.workplace_id
      ? workplaceById.get(log.workplace_id)
      : workplaces.find((workplace) => workplace.name === log.workplace);
  }

  function matchesWorkplace(workplaceId: string | null, workplaceName: string) {
    if (workplaceFilter === "all") return true;
    const selected = workplaceById.get(workplaceFilter);
    if (!selected) return false;
    return workplaceId ? workplaceId === selected.id : workplaceName === selected.name;
  }

  const filteredLogs = useMemo(
    () => logs.filter((log) => matchesWorkplace(log.workplace_id, log.workplace)),
    [logs, workplaceFilter, workplaceById]
  );

  const filteredPayments = useMemo(
    () => payments.filter((payment) => matchesWorkplace(payment.workplace_id, payment.workplace_name)),
    [payments, workplaceFilter, workplaceById]
  );

  const months = useMemo(() => {
    const result: string[] = [];
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 5);
    for (let index = 0; index < 6; index += 1) {
      result.push(monthKey(localDateKey(start)));
      start.setMonth(start.getMonth() + 1);
    }
    return result;
  }, []);

  const summaries = useMemo(() => {
    const byCurrency = new Map<string, CurrencySummary>();
    const ensure = (currency: string) => {
      if (!byCurrency.has(currency)) {
        byCurrency.set(currency, {
          currency,
          earned: 0,
          received: 0,
          outstanding: 0,
          classes: 0,
          monthly: months.map((month) => ({ month, earned: 0, received: 0 })),
        });
      }
      return byCurrency.get(currency)!;
    };

    for (const log of filteredLogs) {
      const currency = getLogWorkplace(log)?.currency ?? "USD";
      const summary = ensure(currency);
      const income = Number(log.income ?? 0);
      summary.classes += Number(log.classes ?? 0);
      if (monthKey(log.log_date) === currentMonth) summary.earned += income;
      const month = summary.monthly.find((item) => item.month === monthKey(log.log_date));
      if (month) month.earned += income;
    }

    for (const payment of filteredPayments) {
      const currency = payment.currency || workplaceById.get(payment.workplace_id ?? "")?.currency || "USD";
      const summary = ensure(currency);
      if (monthKey(payment.payment_date) === currentMonth) {
        summary.received += Number(payment.amount ?? 0);
      }
      const month = summary.monthly.find((item) => item.month === monthKey(payment.payment_date));
      if (month) month.received += Number(payment.amount ?? 0);
    }

    for (const workplace of selectedWorkplaces) {
      const summary = ensure(workplace.currency || "USD");
      summary.outstanding += allocatePayments(filteredLogs, filteredPayments, workplace).outstanding;
    }

    return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
  }, [filteredLogs, filteredPayments, selectedWorkplaces, workplaceById, months, currentMonth, workplaces]);

  const workplaceBalances = useMemo(() => selectedWorkplaces.map((workplace) => {
    const workplaceLogs = filteredLogs.filter((log) =>
      log.workplace_id === workplace.id || (!log.workplace_id && log.workplace === workplace.name)
    );
    const earned = workplaceLogs.reduce((sum, log) => sum + Number(log.income ?? 0), 0);
    const outstanding = allocatePayments(filteredLogs, filteredPayments, workplace).outstanding;
    return { ...workplace, earned, outstanding };
  }).filter((workplace) => workplace.earned > 0 || workplace.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding), [selectedWorkplaces, filteredLogs, filteredPayments]);

  const recentLogs = filteredLogs.slice(0, 6);
  const currentMonthLogs = filteredLogs.filter((log) => monthKey(log.log_date) === currentMonth);
  const currentMonthClasses = currentMonthLogs.reduce((sum, log) => sum + Number(log.classes ?? 0), 0);

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading your dashboard...</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live overview of your teaching income, received payments, and outstanding balances."
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value)} aria-label="Filter workplace">
              <option value="all">All workplaces</option>
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}{workplace.archived ? " (archived)" : ""}
                </option>
              ))}
            </Select>
            <Link to="/app/daily-log">
              <Button><BookOpen size={16} /> Add daily log</Button>
            </Link>
          </div>
        }
      />

      {pageError && (
        <Card className="mb-5 border-red-200 p-4 dark:border-red-900">
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">{pageError}</p>
          <Button className="mt-3" variant="secondary" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
            <RefreshCw size={14} /> Try again
          </Button>
        </Card>
      )}

      {!pageError && workplaces.length === 0 && (
        <Card className="mb-5 p-5">
          <h2 className="font-bold">Start by adding a workplace</h2>
          <p className="mt-1 text-sm text-muted">Set up your tutoring workplace and class rate first. Your dashboard will summarize your saved records here.</p>
          <Link to="/app/workplaces" className="mt-3 inline-flex">
            <Button>Set up a workplace</Button>
          </Link>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.length > 0 ? summaries.map((summary) => (
          <Card key={summary.currency} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted">Earned this month · {summary.currency}</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight">{formatMoney(summary.earned, summary.currency)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl stat-brand">
                <CircleDollarSign size={19} />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">{currentMonthClasses.toLocaleString()} classes logged this month across selected workplaces</p>
          </Card>
        )) : (
          <Card className="p-5 sm:col-span-2 xl:col-span-4">
            <p className="text-sm text-muted">No income recorded yet. Add your first entry in Daily Log to see your dashboard come to life.</p>
            <Link to="/app/daily-log" className="mt-3 inline-flex"><Button variant="secondary">Open Daily Log</Button></Link>
          </Card>
        )}
        {summaries.map((summary) => (
          <Card key={`received-${summary.currency}`} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted">Received this month · {summary.currency}</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight">{formatMoney(summary.received, summary.currency)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl stat-teal">
                <WalletCards size={19} />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">Based on the payment dates you recorded</p>
          </Card>
        ))}
        {summaries.map((summary) => (
          <Card key={`owed-${summary.currency}`} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted">Still owed · {summary.currency}</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight">{formatMoney(summary.outstanding, summary.currency)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl stat-amber">
                <Clock3 size={19} />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">Unpaid recorded class income, across all dates</p>
          </Card>
        ))}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-muted">Classes this month</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight">{currentMonthClasses.toLocaleString()}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl stat-blue">
              <CalendarDays size={19} />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">Across selected workplaces</p>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          {summaries.filter((summary) => summary.monthly.some((item) => item.earned > 0 || item.received > 0)).map((summary) => (
            <Card key={summary.currency} className="p-5">
              <div>
                <h2 className="font-bold">Earned vs. received · {summary.currency}</h2>
                <p className="text-xs text-muted">Last 6 months, based on class dates and payment dates</p>
              </div>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.monthly} barGap={4}>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} width={48} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const [year, month] = String(value).split("-").map(Number);
                        return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
                      }}
                      formatter={(value) => formatMoney(Number(value), summary.currency)}
                    />
                    <Bar dataKey="earned" name="Earned" fill="#76BE3F" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="received" name="Received" fill="#2F7D6D" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-5 text-xs text-muted">
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-brand" />Earned</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#2F7D6D]" />Received</span>
              </div>
            </Card>
          ))}
          {summaries.every((summary) => summary.monthly.every((item) => item.earned === 0 && item.received === 0)) && (
            <Card className="p-6 text-center">
              <CircleDollarSign className="mx-auto text-muted" size={28} />
              <h2 className="mt-2 font-bold">Your income trend will appear here</h2>
              <p className="mt-1 text-sm text-muted">Once you record classes or payments, this chart will show your last six months.</p>
            </Card>
          )}
        </div>

        <Card className="p-5">
          <div>
            <h2 className="font-bold">Outstanding by workplace</h2>
            <p className="text-xs text-muted">Unpaid income calculated from your saved class logs and payment allocations</p>
          </div>
          {workplaceBalances.length > 0 ? (
            <div className="mt-4 space-y-4">
              {workplaceBalances.map((workplace) => (
                <div key={workplace.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold">{workplace.name}</p>
                    <p className="shrink-0 text-sm font-bold">{formatMoney(workplace.outstanding, workplace.currency)}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${workplace.earned > 0 ? Math.min(100, (workplace.outstanding / workplace.earned) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">Total earned: {formatMoney(workplace.earned, workplace.currency)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No class income has been recorded for this workplace filter yet.</p>
          )}
          <Link to="/app/payments" className="mt-5 inline-flex">
            <Button variant="secondary">Review payments</Button>
          </Link>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-bold">Recent class logs</h2>
              <p className="text-xs text-muted">Your latest saved Daily Log entries</p>
            </div>
            <Link to="/app/daily-log"><Button variant="ghost" className="h-9 min-h-0 px-3 text-xs">View daily logs</Button></Link>
          </div>
          {recentLogs.length > 0 ? (
            <div className="divide-y divide-line">
              {recentLogs.map((log) => {
                const workplace = getLogWorkplace(log);
                const currency = workplace?.currency ?? "USD";
                return (
                  <div key={log.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                      <BookOpen size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{log.workplace || "Unknown workplace"}</p>
                      <p className="text-xs text-muted">{displayDate(log.log_date)} · {Number(log.classes ?? 0)} {Number(log.classes ?? 0) === 1 ? "class" : "classes"}{log.notes ? ` · ${log.notes}` : ""}</p>
                    </div>
                    <p className="text-sm font-bold">{formatMoney(Number(log.income ?? 0), currency)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted">No class logs yet. Your recent entries will appear here.</p>
              <Link to="/app/daily-log" className="mt-3 inline-flex"><Button>Add your first log</Button></Link>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

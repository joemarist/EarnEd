import {
  FileSpreadsheet,
  FileText,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
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
  amount: number;
  currency: string;
  payment_date: string;
};

type ReportRow = {
  month: string;
  workplace: string;
  currency: string;
  classes: number;
  earned: number;
  received: number;
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

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ReportsPage() {
  const today = dateKey(new Date());
  const defaultStart = dateKey(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1));
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [range, setRange] = useState("last6");
  const [workplaceFilter, setWorkplaceFilter] = useState("all");
  const [customStart, setCustomStart] = useState(defaultStart);
  const [customEnd, setCustomEnd] = useState(today);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReportData() {
      setLoading(true);
      setPageError("");

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error("Please sign in to view your reports.");
        }

        const [workplaceResult, logResult, paymentResult] = await Promise.all([
          supabase
            .from("workplaces")
            .select("id, name, currency, archived")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_logs")
            .select("id, workplace_id, workplace, log_date, classes, rate_per_class, income")
            .eq("user_id", userData.user.id)
            .order("log_date", { ascending: true }),
          supabase
            .from("payments")
            .select("id, workplace_id, workplace_name, amount, currency, payment_date")
            .eq("user_id", userData.user.id)
            .order("payment_date", { ascending: true }),
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
          setPageError(error instanceof Error ? error.message : "We could not load your report data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReportData();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedRange = useMemo(() => {
    if (range === "year") {
      return {
        start: `${new Date().getFullYear()}-01-01`,
        end: today,
      };
    }
    if (range === "custom") {
      return { start: customStart, end: customEnd };
    }
    return { start: defaultStart, end: today };
  }, [range, customStart, customEnd, defaultStart, today]);

  const workplaceById = useMemo(
    () => new Map(workplaces.map((workplace) => [workplace.id, workplace])),
    [workplaces],
  );

  function getLogWorkplace(log: DailyLog) {
    return log.workplace_id
      ? workplaceById.get(log.workplace_id)
      : workplaces.find((workplace) => workplace.name === log.workplace);
  }

  function matchesWorkplace(workplaceId: string | null, workplaceName: string) {
    if (workplaceFilter === "all") return true;
    const selectedWorkplace = workplaceById.get(workplaceFilter);
    if (!selectedWorkplace) return false;
    return workplaceId
      ? workplaceId === selectedWorkplace.id
      : workplaceName === selectedWorkplace.name;
  }

  const filteredLogs = useMemo(() => logs.filter((log) =>
    log.log_date >= selectedRange.start &&
    log.log_date <= selectedRange.end &&
    matchesWorkplace(log.workplace_id, log.workplace)
  ), [logs, selectedRange, workplaceFilter, workplaceById]);

  const filteredPayments = useMemo(() => payments.filter((payment) =>
    payment.payment_date >= selectedRange.start &&
    payment.payment_date <= selectedRange.end &&
    matchesWorkplace(payment.workplace_id, payment.workplace_name)
  ), [payments, selectedRange, workplaceFilter, workplaceById]);

  const months = useMemo(() => {
    if (!selectedRange.start || !selectedRange.end || selectedRange.end < selectedRange.start) return [];
    const [startYear, startMonth] = selectedRange.start.split("-").map(Number);
    const [endYear, endMonth] = selectedRange.end.split("-").map(Number);
    const result: string[] = [];
    const cursor = new Date(startYear, startMonth - 1, 1);
    const last = new Date(endYear, endMonth - 1, 1);
    while (cursor <= last && result.length < 120) {
      result.push(monthKey(dateKey(cursor)));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [selectedRange]);

  const reportByCurrency = useMemo(() => {
    const currencies = new Map<string, {
      earned: number;
      received: number;
      classes: number;
      monthly: Array<{ month: string; earned: number; received: number }>;
    }>();

    const ensureCurrency = (currency: string) => {
      if (!currencies.has(currency)) {
        currencies.set(currency, {
          earned: 0,
          received: 0,
          classes: 0,
          monthly: months.map((month) => ({ month, earned: 0, received: 0 })),
        });
      }
      return currencies.get(currency)!;
    };

    for (const log of filteredLogs) {
      const currency = getLogWorkplace(log)?.currency ?? "USD";
      const summary = ensureCurrency(currency);
      const income = Number(log.income ?? 0);
      summary.earned += income;
      summary.classes += Number(log.classes ?? 0);
      const month = summary.monthly.find((item) => item.month === monthKey(log.log_date));
      if (month) month.earned += income;
    }

    for (const payment of filteredPayments) {
      const currency = payment.currency || workplaceById.get(payment.workplace_id ?? "")?.currency || "USD";
      const summary = ensureCurrency(currency);
      const amount = Number(payment.amount ?? 0);
      summary.received += amount;
      const month = summary.monthly.find((item) => item.month === monthKey(payment.payment_date));
      if (month) month.received += amount;
    }

    return Array.from(currencies.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, summary]) => ({
        currency,
        ...summary,
        averagePerClass: summary.classes > 0 ? summary.earned / summary.classes : 0,
        averageMonthly: months.length > 0 ? summary.earned / months.length : 0,
        highestMonth: summary.monthly.reduce(
          (best, item) => item.earned > best.earned ? item : best,
          { month: "", earned: 0, received: 0 },
        ),
      }));
  }, [filteredLogs, filteredPayments, months, workplaceById, workplaces]);

  const workplaceRows = useMemo(() => {
    const rows = new Map<string, {
      workplace: string;
      currency: string;
      classes: number;
      earned: number;
    }>();

    for (const log of filteredLogs) {
      const workplace = getLogWorkplace(log);
      const name = workplace?.name ?? log.workplace ?? "Unknown workplace";
      const currency = workplace?.currency ?? "USD";
      const key = `${workplace?.id ?? name}|${currency}`;
      const row = rows.get(key) ?? { workplace: name, currency, classes: 0, earned: 0 };
      row.classes += Number(log.classes ?? 0);
      row.earned += Number(log.income ?? 0);
      rows.set(key, row);
    }

    const totalsByCurrency = new Map<string, number>();
    for (const row of rows.values()) {
      totalsByCurrency.set(row.currency, (totalsByCurrency.get(row.currency) ?? 0) + row.earned);
    }

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        averageRate: row.classes > 0 ? row.earned / row.classes : 0,
        share: (totalsByCurrency.get(row.currency) ?? 0) > 0
          ? (row.earned / (totalsByCurrency.get(row.currency) ?? 1)) * 100
          : 0,
      }))
      .sort((a, b) => b.earned - a.earned);
  }, [filteredLogs, workplaceById, workplaces]);

  const csvRows = useMemo(() => {
    const rows = new Map<string, ReportRow>();
    const ensureRow = (month: string, workplace: string, currency: string) => {
      const key = `${month}|${workplace}|${currency}`;
      if (!rows.has(key)) {
        rows.set(key, { month, workplace, currency, classes: 0, earned: 0, received: 0 });
      }
      return rows.get(key)!;
    };

    for (const log of filteredLogs) {
      const workplace = getLogWorkplace(log);
      const row = ensureRow(monthKey(log.log_date), workplace?.name ?? log.workplace ?? "Unknown workplace", workplace?.currency ?? "USD");
      row.classes += Number(log.classes ?? 0);
      row.earned += Number(log.income ?? 0);
    }
    for (const payment of filteredPayments) {
      const workplace = workplaceById.get(payment.workplace_id ?? "");
      const row = ensureRow(monthKey(payment.payment_date), workplace?.name ?? payment.workplace_name, payment.currency || workplace?.currency || "USD");
      row.received += Number(payment.amount ?? 0);
    }
    return Array.from(rows.values()).sort((a, b) =>
      a.month.localeCompare(b.month) || a.workplace.localeCompare(b.workplace)
    );
  }, [filteredLogs, filteredPayments, workplaceById, workplaces]);

  function exportCsv() {
    const content = [
      ["Month", "Workplace", "Currency", "Classes", "Earned", "Payments received"].map(csvCell).join(","),
      ...csvRows.map((row) => [
        row.month,
        row.workplace,
        row.currency,
        row.classes,
        row.earned.toFixed(2),
        row.received.toFixed(2),
      ].map(csvCell).join(",")),
    ].join("\n");
    downloadText("earned-income-report.csv", content);
  }

  const invalidCustomRange = range === "custom" &&
    (!customStart || !customEnd || customEnd < customStart);

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading your reports...</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Earnings reports"
        description="Explore your recorded class income and payments received, using the same saved records as Daily Logs and Payments."
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="secondary" onClick={exportCsv} disabled={csvRows.length === 0 || invalidCustomRange}>
              <FileSpreadsheet size={16} /> CSV
            </Button>
            <Button onClick={() => window.print()}>
              <FileText size={16} /> PDF
            </Button>
          </div>
        }
      />

      {pageError && (
        <Card className="mb-5 border-red-200 p-4 dark:border-red-900">
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">{pageError}</p>
          <Button className="mt-3" variant="secondary" onClick={() => setReloadKey((value) => value + 1)}>
            <RefreshCw size={14} /> Try again
          </Button>
        </Card>
      )}

      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">
            Date range
            <Select value={range} onChange={(event) => setRange(event.target.value)} className="mt-2 w-full">
              <option value="last6">Last 6 months</option>
              <option value="year">This year</option>
              <option value="custom">Custom range</option>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Workplace
            <Select value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value)} className="mt-2 w-full">
              <option value="all">All workplaces</option>
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}{workplace.archived ? " (archived)" : ""}
                </option>
              ))}
            </Select>
          </label>
          {range === "custom" && (
            <>
              <label className="text-sm font-semibold">
                Start date
                <Input type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-semibold">
                End date
                <Input type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} className="mt-2" />
              </label>
            </>
          )}
        </div>
        {invalidCustomRange && (
          <p role="alert" className="mt-3 text-sm text-red-600">Choose a valid date range. The end date must be on or after the start date.</p>
        )}
        {!invalidCustomRange && (
          <p className="mt-3 text-xs text-muted">
            Showing {selectedRange.start} to {selectedRange.end}. Payments are counted by the date you recorded receiving them.
          </p>
        )}
      </Card>

      {filteredLogs.length === 0 && filteredPayments.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingUp className="mx-auto text-muted" size={30} />
          <h2 className="mt-3 font-bold">No report data for this period</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Add class entries in Daily Logs or record received payments in Payments. You can also widen the date range or choose another workplace.
          </p>
        </Card>
      ) : (
        <>
          <section className="mb-5 grid gap-4 sm:grid-cols-2">
            {reportByCurrency.map((summary) => (
              <Card key={summary.currency} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">Total earned · {summary.currency}</p>
                    <p className="mt-2 text-2xl font-bold">{formatMoney(summary.earned, summary.currency)}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                    <TrendingUp size={19} />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                  <div>
                    <p className="text-xs text-muted">Payments received</p>
                    <p className="mt-1 font-bold">{formatMoney(summary.received, summary.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Average per class</p>
                    <p className="mt-1 font-bold">{formatMoney(summary.averagePerClass, summary.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Average earned per month</p>
                    <p className="mt-1 font-bold">{formatMoney(summary.averageMonthly, summary.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Classes taught</p>
                    <p className="mt-1 font-bold">{summary.classes.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-soft p-3">
                  <p className="text-xs text-muted">Highest earning month</p>
                  <p className="mt-1 font-semibold">
                    {summary.highestMonth.month
                      ? `${monthLabel(summary.highestMonth.month)} · ${formatMoney(summary.highestMonth.earned, summary.currency)}`
                      : "No class income recorded"}
                  </p>
                </div>
              </Card>
            ))}
          </section>

          {reportByCurrency.map((summary) => (
            <Card key={summary.currency} className="mb-5 p-5">
              <div>
                <h2 className="font-bold">Monthly income trend · {summary.currency}</h2>
                <p className="text-xs text-muted">Earned from Daily Logs compared with payments received during each month</p>
              </div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.monthly}>
                    <defs>
                      <linearGradient id={`earnedFill-${summary.currency}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#76BE3F" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#76BE3F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={`receivedFill-${summary.currency}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2F7D6D" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2F7D6D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={monthLabel}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      tickFormatter={(value) => Number(value).toLocaleString()}
                    />
                    <Tooltip
                      labelFormatter={(value) => monthLabel(String(value))}
                      formatter={(value) => formatMoney(Number(value), summary.currency)}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="earned" name="Earned" stroke="#76BE3F" strokeWidth={2.5} fill={`url(#earnedFill-${summary.currency})`} />
                    <Area type="monotone" dataKey="received" name="Received" stroke="#2F7D6D" strokeWidth={2.5} fill={`url(#receivedFill-${summary.currency})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}

          <Card className="mb-5 overflow-hidden">
            <div className="border-b border-line p-5">
              <h2 className="font-bold">Per-workplace performance</h2>
              <p className="text-xs text-muted">Class totals and earnings use the historical rate saved with each Daily Log. Share is calculated only against workplaces using the same currency.</p>
            </div>
            {workplaceRows.length === 0 ? (
              <p className="p-6 text-sm text-muted">No class income was recorded for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-soft text-xs uppercase text-muted">
                    <tr>
                      <th className="px-5 py-3">Workplace</th>
                      <th className="px-4 py-3">Classes</th>
                      <th className="px-4 py-3">Avg. rate</th>
                      <th className="px-4 py-3">Earned</th>
                      <th className="px-4 py-3">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {workplaceRows.map((row) => (
                      <tr key={row.workplace + row.currency}>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{row.workplace}</p>
                          <p className="text-xs text-muted">{row.currency}</p>
                        </td>
                        <td className="px-4 py-4">{row.classes.toLocaleString()}</td>
                        <td className="px-4 py-4">{formatMoney(row.averageRate, row.currency)}</td>
                        <td className="px-4 py-4 font-bold">{formatMoney(row.earned, row.currency)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-soft">
                              <div className="h-full rounded-full bg-brand" style={{ width: `${row.share}%` }} />
                            </div>
                            <span className="text-xs text-muted">{row.share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line p-5">
              <h2 className="font-bold">Report notes</h2>
              <p className="mt-1 text-xs text-muted">How to interpret the numbers in this report</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <GraduationCap size={19} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold">Earned income</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">Based on saved Daily Logs and their historical class rates. Editing a workplace's current rate does not rewrite older entries.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Wallet size={19} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold">Payments received</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">Based on payment records and the actual payment date. A payment may relate to classes from an earlier pay period, so monthly received totals may differ from monthly earned totals.</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

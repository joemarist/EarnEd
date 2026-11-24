import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components/ui";
import { supabase } from "../lib/supabase";

type Workplace = {
  id: string;
  name: string;
  currency: string;
  rate: number;
  rate_effective: string;
  archived: boolean;
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

export function DailyLogPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [workplaceFilter, setWorkplaceFilter] = useState("All workplaces");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [logs, setLogs] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [allWorkplaces, setAllWorkplaces] = useState<Workplace[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      setLoading(true);
      setPageError("");
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          if (active) setPageError("Please sign in to view your daily logs and workplaces.");
          return;
        }

        const [workplaceResult, logResult] = await Promise.all([
          supabase
            .from("workplaces")
            .select("id, name, currency, rate, rate_effective, archived")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", userData.user.id)
            .order("log_date", { ascending: true }),
        ]);

        if (workplaceResult.error) throw new Error(workplaceResult.error.message);
        if (logResult.error) throw new Error(logResult.error.message);
        if (active) {
          const savedWorkplaces = (workplaceResult.data ?? []) as Workplace[];
          setAllWorkplaces(savedWorkplaces);
          setWorkplaces(savedWorkplaces.filter((workplace) => !workplace.archived));
          setLogs(logResult.data ?? []);
        }
      } catch (error) {
        if (active) {
          setPageError(error instanceof Error ? error.message : "We could not load your daily log data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPageData();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const [adding, setAdding] = useState(false);
  const [viewingDayLogs, setViewingDayLogs] = useState<any[] | null>(null);
  const [editingWorkplace, setEditingWorkplace] = useState<string | null>(null);
  const [editedClasses, setEditedClasses] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [selectedWorkplace, setSelectedWorkplace] = useState("");
  const [classCount, setClassCount] = useState(3);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const selectedWorkplaceInfo = workplaces.find(
    (item) => item.name === selectedWorkplace
  );
  const estimatedRate = Number(selectedWorkplaceInfo?.rate ?? 0);
  const estimatedIncome = classCount * estimatedRate;
  const selectedCurrency = selectedWorkplaceInfo?.currency ?? "USD";

  function currencyForWorkplace(name: string) {
    return allWorkplaces.find((workplace) => workplace.name === name)?.currency ?? "USD";
  }

  function formatIncomeSummary(records: any[]) {
    const totals = records.reduce((result: Record<string, number>, log: any) => {
      const currency = currencyForWorkplace(log.workplace);
      result[currency] = (result[currency] ?? 0) + Number(log.income ?? 0);
      return result;
    }, {});
    return Object.entries(totals)
      .map(([currency, total]) => formatMoney(total, currency))
      .join(" + ");
  }

  async function saveQuickAdd() {
    if (!selectedDate || !selectedWorkplace || !Number.isInteger(classCount) || classCount < 0) {
      setSaveError("Please fill in all required fields.");
      return;
    }
  
    setSaving(true);
    setSaveError("");
  
    const workplaceInfo = workplaces.find(
      (item) => item.name === selectedWorkplace
    );
  
    if (!workplaceInfo) {
      setSaveError("Please select a valid workplace.");
      setSaving(false);
      return;
    }
  
    const rate = workplaceInfo.rate;
    const income = classCount * rate;
  
    const { data: userData, error: userError } = await supabase.auth.getUser();
  
    if (userError || !userData.user) {
      setSaveError("You must be logged in to save a daily log.");
      setSaving(false);
      return;
    }

    if (classCount === 0) {
      const { error } = await supabase
        .from("daily_logs")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("log_date", selectedDate)
        .eq("workplace", selectedWorkplace);
    
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    
      setLogs((previous) =>
        previous.filter(
          (log) =>
            !(
              log.log_date === selectedDate &&
              log.workplace === selectedWorkplace
            )
        )
      );
    
      setAdding(false);
      setSaving(false);
      setRemark("");
      setClassCount(3);
      setSelectedWorkplace("");
      return;
    }
  
    const { data: savedLog, error: insertError } = await supabase
      .from("daily_logs")
      .insert({
        user_id: userData.user.id,
        log_date: selectedDate,
        workplace: selectedWorkplace,
        workplace_id: workplaceInfo.id,
        classes: classCount,
        rate_per_class: rate,
        income,
        notes: remark.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      setSaveError(insertError.message);
      setSaving(false);
      return;
    }

    setLogs((previous) => [...previous, savedLog]);
    setAdding(false);
    setSaving(false);
    setRemark("");
    setClassCount(3);
    setSelectedWorkplace("");
  }

  async function saveEditedClasses(group: any) {
    if (!Number.isInteger(editedClasses) || editedClasses < 0) {
      return;
    }
  
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setSaveError("You must be logged in to edit daily logs.");
      return;
    }
    const originalLogs = group.logs;

    if (editedClasses === 0) {
      setSaving(true);
      setSaveError("");
    
      const ids = group.logs.map((log: any) => log.id);
    
      const { error } = await supabase
        .from("daily_logs")
        .delete()
        .eq("user_id", userData.user.id)
        .in("id", ids);
    
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    
      setLogs((previous) =>
        previous.filter((log) => !ids.includes(log.id))
      );
    
      setViewingDayLogs((previous) =>
        previous
          ? previous.filter((log) => !ids.includes(log.id))
          : previous
      );
    
      setEditingWorkplace(null);
      setSaving(false);
      return;
    }
  
    // Keep existing class counts where possible.
    // If the total is reduced, remove classes from later records first.
    const updatedCounts = originalLogs.map((log: any) => log.classes ?? 0);
  
    let remaining = editedClasses;
  
    for (let i = 0; i < updatedCounts.length; i++) {
      const kept = Math.min(updatedCounts[i], remaining);
      updatedCounts[i] = kept;
      remaining -= kept;
    }
  
    // If the new total is higher, add the extra classes to the first record.
    if (remaining > 0 && updatedCounts.length > 0) {
      updatedCounts[0] += remaining;
    }
  
    setSaving(true);
    setSaveError("");
  
    for (let i = 0; i < originalLogs.length; i++) {
      const log = originalLogs[i];
      const newClasses = updatedCounts[i];
      const newIncome = newClasses * (log.rate_per_class ?? 0);
  
      const { error } = await supabase
        .from("daily_logs")
        .update({
          classes: newClasses,
          income: newIncome,
        })
        .eq("id", log.id)
        .eq("user_id", userData.user.id);
  
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    }
  
    const updatedLogs = originalLogs.map((log: any, index: number) => ({
      ...log,
      classes: updatedCounts[index],
      income: updatedCounts[index] * (log.rate_per_class ?? 0),
    }));
  
    setLogs((previous) =>
      previous.map((log) => {
        const updated = updatedLogs.find((item: any) => item.id === log.id);
        return updated ?? log;
      })
    );
  
    setViewingDayLogs((previous) =>
      previous
        ? previous.map((log) => {
          const updated = updatedLogs.find((item: any) => item.id === log.id);
            return updated ?? log;
          })
        : previous
    );
  
    setEditingWorkplace(null);
    setSaving(false);
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();

  const days = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1
  );
  const logsByDate = useMemo(() => {
    return logs.reduce((groups, log) => {
      const date = log.log_date;
  
      if (!groups[date]) {
        groups[date] = [];
      }
  
      groups[date].push(log);
      return groups;
    }, {} as Record<string, any[]>);
  }, [logs]);

  const monthlyLogs = logs.filter((log) =>
    log.log_date.startsWith(
      `${year}-${String(month + 1).padStart(2, "0")}`
    )
  );
  
  const monthlyClasses = monthlyLogs.reduce(
    (sum: number, log: any) => sum + (log.classes ?? 0),
    0
  );
  
  const groupedDayLogs = useMemo(() => {
    if (!viewingDayLogs) return [];
  
    const groups = viewingDayLogs.reduce(
      (result: Record<string, any>, log: any) => {
        const workplace = log.workplace || "Unknown workplace";
  
        if (!result[workplace]) {
          result[workplace] = {
            workplace,
            classes: 0,
            income: 0,
            logs: [],
          };
        }
  
        result[workplace].classes += log.classes ?? 0;
        result[workplace].income += log.income ?? 0;
        result[workplace].logs.push(log);
  
        return result;
      },
      {}
    );
  
    return Object.values(groups);
  }, [viewingDayLogs]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted">
        Loading daily logs...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Classes"
        title="Daily log"
        description="Track classes by workplace, with each entry preserving the rate used when it was saved."
        action={
          <Button
            disabled={workplaces.length === 0}
            onClick={() => {
              setSelectedDate(
                `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
              );
              setSelectedWorkplace(workplaces[0]?.name ?? "");
              setClassCount(3);
              setRemark("");
              setSaveError("");
              setAdding(true);
            }}
          >
            <Plus size={16} /> Quick add
          </Button>
        }
      />
      {pageError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <span>{pageError}</span>
          <Button variant="secondary" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>Try again</Button>
        </div>
      )}
      {workplaces.length === 0 && !pageError && (
        <Card className="mb-4 p-4 text-sm text-muted">
          Add an active workplace in Workplaces &amp; Rates before recording classes.
        </Card>
      )}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="h-10 w-10 px-0"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
        >
          <ChevronLeft size={17} />
        </Button>
          <h2 className="min-w-32 text-center font-bold">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button
            variant="secondary"
            className="h-10 w-10 px-0"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight size={17} />
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setCurrentMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              )
            }
          >
            <RotateCcw size={15} /> Today
          </Button>
        </div>
        <div className="flex items-center rounded-xl border border-line bg-surface p-1">
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "calendar" ? "bg-brand text-white" : "text-muted"}`}
          >
            <CalendarDays size={15} /> Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "list" ? "bg-brand text-white" : "text-muted"}`}
          >
            <List size={15} /> List
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-soft text-center text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOffset }).map((_, index) => (
            <div
              key={`blank-${index}`}
              className="min-h-22 border-b border-r border-line bg-soft/30 sm:min-h-29"
            />
          ))}
            {days.map((day) => {
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayLogs = logsByDate[dateKey] ?? [];
              const totalClasses = dayLogs.reduce(
                (sum: number, log: any) => sum + (log.classes ?? 0),
                0
              );
              const today = new Date();
              const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (dayLogs.length > 0) {
                      setViewingDayLogs(dayLogs);
                    } else {
                      setSelectedDate(dateKey);
                      setSelectedWorkplace(workplaces[0]?.name ?? "");
                      setClassCount(3);
                      setRemark("");
                      setSaveError("");
                      setAdding(true);
                    }
                  }}
                  className="relative min-h-22 border-b border-r border-line p-1.5 text-left transition hover:bg-brand-soft/40 sm:min-h-29 sm:p-2.5"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-brand text-white" : ""}`}
                  >
                    {day}
                  </span>
                  {dayLogs.length > 0 && (
                    <div className="mt-1 rounded-md border-l-3 border-brand bg-brand-soft p-1.5 text-[9px] leading-tight text-brand-dark dark:text-brand sm:text-[11px]">
                      <p className="truncate font-semibold">
                        {[...new Set(dayLogs.map((log: any) => log.workplace))]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      <p className="font-bold">
                        {totalClasses} {totalClasses === 1 ? "class" : "classes"}
                      </p>

                      <p className="mt-0.5 hidden opacity-70 sm:block">
                        {formatIncomeSummary(dayLogs)}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-muted">
          <span>
            Month total:{" "}
            <b className="text-ink">
              {monthlyClasses} {monthlyClasses === 1 ? "class" : "classes"} ·{" "}
              {formatIncomeSummary(monthlyLogs)}
            </b>
          </span>
            <span>Each entry keeps its saved rate</span>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-muted" size={16} />
              <Input
                placeholder="Search remarks or workplaces"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value)}
            >
              <option value="All workplaces">All workplaces</option>
              {workplaces.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="divide-y divide-line">
          {monthlyLogs
            .filter((log) => {
              const term = searchTerm.toLowerCase().trim();

              const matchesSearch =
                !term ||
                (log.workplace ?? "").toLowerCase().includes(term) ||
                (log.notes ?? "").toLowerCase().includes(term) ||
                log.log_date.includes(term);

              const matchesWorkplace =
                workplaceFilter === "All workplaces" ||
                log.workplace === workplaceFilter;

              return matchesSearch && matchesWorkplace;
            })
            .map((log) => (
              <div
                key={log.id}
                className="grid items-center gap-3 p-4 sm:grid-cols-[80px_1fr_100px_100px_100px]"
              >
                <div>
                  <p className="text-xs text-muted">
                    {new Date(`${log.log_date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </p>
                  <p className="font-bold">
                    {new Date(`${log.log_date}T12:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{log.workplace}</p>
                  {log.notes && <Badge>{log.notes}</Badge>}
                </div>
                <p className="text-sm">{log.classes} classes</p>
                <p className="text-sm text-muted">
                  {log.rate_per_class ? `${formatMoney(log.rate_per_class, currencyForWorkplace(log.workplace))}/class` : "—"}
                </p>
                <p className="font-bold sm:text-right">{formatMoney(log.income, currencyForWorkplace(log.workplace))}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {viewingDayLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-surface">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Daily Classes</h2>
              <button
                type="button"
                onClick={() => setViewingDayLogs(null)}
                className="rounded-lg px-3 py-1 text-sm text-muted hover:bg-soft"
              >
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-muted">
              {viewingDayLogs[0].log_date}
            </p>

            <div className="space-y-3">
            {groupedDayLogs.map((group: any) => (
              <div
              key={group.workplace}
              className="rounded-xl border border-line p-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{group.workplace}</p>
            
                {editingWorkplace !== group.workplace && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorkplace(group.workplace);
                      setEditedClasses(group.classes);
                    }}
                    className="rounded-lg border border-line px-3 py-1 text-xs font-medium hover:bg-soft"
                  >
                    Edit
                  </button>
                )}
              </div>
            
              {editingWorkplace === group.workplace ? (
                <div className="mt-3">
                  <label className="text-sm font-medium">
                    Total classes
                    <Input
                      type="number"
                      min="0"
                      value={editedClasses}
                      onChange={(e) => setEditedClasses(Number(e.target.value))}
                      className="mt-1"
                    />
                  </label>
            
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingWorkplace(null)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-soft"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => saveEditedClasses(group)}
                      disabled={saving}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm">
                    {group.classes} {group.classes === 1 ? "class" : "classes"}
                  </p>
            
                  <p className="font-semibold text-brand">
                    Income: {formatMoney(group.income, currencyForWorkplace(group.workplace))}
                  </p>
                </>
              )}
            
              {group.logs.some((log: any) => log.notes) && (
                <div className="mt-2 space-y-1">
                  {group.logs
                    .filter((log: any) => log.notes)
                    .map((log: any) => (
                      <p key={log.id} className="text-sm text-muted">
                        {log.notes}
                      </p>
                    ))}
                </div>
              )}
            </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setViewingDayLogs(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-soft"
              >
                Close
              </button>

              <button
                type="button"
                disabled={workplaces.length === 0}
                onClick={() => {
                  setSelectedDate(viewingDayLogs[0].log_date);
                  setSelectedWorkplace(workplaces[0]?.name ?? "");
                  setClassCount(3);
                  setRemark("");
                  setSaveError("");
                  setViewingDayLogs(null);
                  setAdding(true);
                }}
                className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                + Add Classes
              </button>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onMouseDown={() => setAdding(false)}
        >
          <Card className="w-full max-w-lg rounded-b-none p-5 sm:rounded-2xl">
            <div onMouseDown={(event) => event.stopPropagation()}>
              <h2 className="text-xl font-bold">Add classes</h2>
              <p className="mt-1 text-sm text-muted">
                New entries use the workplace rate saved now. Each entry keeps its own rate for future reference.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Date
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-2"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Workplace
                  <Select
                    className="mt-2 w-full"
                    value={selectedWorkplace}
                    onChange={(e) => setSelectedWorkplace(e.target.value)}
                  >
                    <option value="">Select workplace</option>
                    {workplaces.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-sm font-semibold">
                  Number of classes
                  <Input
                    type="number"
                    min="0"
                    value={classCount}
                    onChange={(e) => setClassCount(Number(e.target.value))}
                    className="mt-2"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Remark
                  <Input
                    placeholder="Optional note"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="mt-2"
                  />
                </label>
              </div>

              {saveError && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {saveError}
                </div>
              )}
              <div className="mt-4 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark dark:text-brand">
                <b>Estimated income: {formatMoney(estimatedIncome, selectedCurrency)}</b>
                <span className="float-right text-xs">
                  at {formatMoney(estimatedRate, selectedCurrency)}/class
                </span>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={saveQuickAdd} disabled={saving || workplaces.length === 0}>
                  {saving ? "Saving..." : "Save classes"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

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
import { workplaces } from "../data/mock";
import { money } from "../lib/utils";
import { supabase } from "../lib/supabase";

export function DailyLogPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .order("log_date", { ascending: true });
  
        if (error) {
          console.error("Error fetching daily logs:", error.message);
          setLoading(false);
          return;
        }
  
      setLogs(data ?? []);
      setLoading(false);
    }
  
    fetchLogs();
  }, []);

  const [adding, setAdding] = useState(false);
  const [viewingDayLogs, setViewingDayLogs] = useState<any[] | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-11-24");
  const [selectedWorkplace, setSelectedWorkplace] = useState(workplaces[0]?.name ?? "");
  const [classCount, setClassCount] = useState(3);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const selectedWorkplaceInfo = workplaces.find(
    (item) => item.name === selectedWorkplace
  );
  const estimatedRate = selectedWorkplaceInfo?.rate ?? 0;
  const estimatedIncome = classCount * estimatedRate;

  async function saveQuickAdd() {
    if (!selectedDate || !selectedWorkplace || classCount < 0) {
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
  
    const { data, error } = await supabase
      .from("daily_logs")
      .insert({
        user_id: userData.user.id,
        log_date: selectedDate,
        workplace: selectedWorkplace,
        classes: classCount,
        rate_per_class: rate,
        income,
        notes: remark.trim() || null,
      })
      .select()
      .single();
  
    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }
  
    setLogs((previous) => [...previous, data]);
    setAdding(false);
    setSaving(false);
    setRemark("");
    setClassCount(3);
    setSelectedWorkplace("");
  }

  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  const logMap = useMemo(
    () =>
      Object.fromEntries(
        logs.map((log) => [Number(log.log_date.split("-")[2]), log])
      ),
    [logs]
  );

  const logsByDay = useMemo(() => {
    return logs.reduce((groups, log) => {
      const day = Number(log.log_date.split("-")[2]);
  
      if (!groups[day]) {
        groups[day] = [];
      }
  
      groups[day].push(log);
      return groups;
    }, {} as Record<number, any[]>);
  }, [logs]);

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
        description="Track every class and let EarnEd apply the right rate for that date."
        action={
          <Button
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
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-10 w-10 px-0">
            <ChevronLeft size={17} />
          </Button>
          <h2 className="min-w-32 text-center font-bold">May 2025</h2>
          <Button variant="secondary" className="h-10 w-10 px-0">
            <ChevronRight size={17} />
          </Button>
          <Button variant="ghost">
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
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`blank-${index}`}
                className="min-h-22 border-b border-r border-line bg-soft/30 sm:min-h-29"
              />
            ))}
            {days.map((day) => {
              const dayLogs = logsByDay[day] ?? [];
              const totalClasses = dayLogs.reduce(
                (sum: number, log: any) => sum + (log.classes ?? 0),
                0
              );
              const totalIncome = dayLogs.reduce(
                (sum: number, log: any) => sum + (log.income ?? 0),
                0
              );
              const isToday = day === 13;
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (dayLogs.length > 0) {
                      setViewingDayLogs(dayLogs);
                    } else {
                      setSelectedDate(
                        `2025-05-${String(day).padStart(2, "0")}`
                      );
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
                        {money(totalIncome)}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-muted">
            <span>
              Month total: <b className="text-ink">18 classes · $227.50</b>
            </span>
            <span>Rates are applied by effective date</span>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-muted" size={16} />
              <Input placeholder="Search remarks or workplaces" className="pl-9" />
            </div>
            <Select>
              <option>All workplaces</option>
              {workplaces.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </Select>
          </div>
          <div className="divide-y divide-line">
            {logs.map((log) => (
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
                  {log.rate_per_class ? `${money(log.rate_per_class)}/class` : "—"}
                </p>
                <p className="font-bold sm:text-right">{money(log.income)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {viewingDayLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-card">
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
              {viewingDayLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-line p-3"
                >
                  <p className="font-semibold">{log.workplace}</p>
                  <p className="mt-1 text-sm">
                    {log.classes} {log.classes === 1 ? "class" : "classes"}
                  </p>
                  <p className="text-sm text-muted">
                    Rate: {money(log.rate_per_class)}/class
                  </p>
                  <p className="font-semibold text-brand">
                    Income: {money(log.income)}
                  </p>

                  {log.notes && (
                    <p className="mt-2 text-sm text-muted">
                      {log.notes}
                    </p>
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
                Income updates automatically from the active rate.
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
                <b>Estimated income: {money(estimatedIncome)}</b>
                <span className="float-right text-xs">
                  at {money(estimatedRate)}/class
                </span>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={saveQuickAdd} disabled={saving}>
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

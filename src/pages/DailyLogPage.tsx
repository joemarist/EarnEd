import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components/ui";
import { dailyLogs, workplaces } from "../data/mock";
import { money } from "../lib/utils";

export function DailyLogPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [logs, setLogs] = useState(dailyLogs);
  const [adding, setAdding] = useState(false);
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  const logMap = useMemo(() => Object.fromEntries(logs.map((log) => [log.number, log])), [logs]);

  function saveQuickAdd() {
    if (!logMap[17])
      setLogs([
        ...logs,
        {
          date: "2025-05-17",
          day: "Sat",
          number: 17,
          workplace: "Bright English",
          classes: 3,
          rate: 15,
          total: 45,
          remark: "",
        },
      ]);
    setAdding(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Classes"
        title="Daily log"
        description="Track every class and let EarnEd apply the right rate for that date."
        action={
          <Button onClick={() => setAdding(true)}>
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
              const log = logMap[day];
              const isToday = day === 13;
              return (
                <button
                  key={day}
                  onClick={() => setAdding(true)}
                  className="relative min-h-22 border-b border-r border-line p-1.5 text-left transition hover:bg-brand-soft/40 sm:min-h-29 sm:p-2.5"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-brand text-white" : ""}`}
                  >
                    {day}
                  </span>
                  {log && (
                    <div
                      className={`mt-1 rounded-md border-l-3 p-1.5 text-[9px] leading-tight sm:text-[11px] ${log.classes ? "border-brand bg-brand-soft text-brand-dark dark:text-brand" : "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950"}`}
                    >
                      <p className="hidden truncate font-semibold sm:block">{log.workplace}</p>
                      <p className="font-bold">
                        {log.classes ? `${log.classes} classes` : log.remark}
                      </p>
                      {log.total > 0 && (
                        <p className="mt-0.5 hidden opacity-70 sm:block">{money(log.total)}</p>
                      )}
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
                key={log.date}
                className="grid items-center gap-3 p-4 sm:grid-cols-[80px_1fr_100px_100px_100px]"
              >
                <div>
                  <p className="text-xs text-muted">{log.day}</p>
                  <p className="font-bold">May {log.number}</p>
                </div>
                <div>
                  <p className="font-semibold">{log.workplace}</p>
                  {log.remark && <Badge>{log.remark}</Badge>}
                </div>
                <p className="text-sm">{log.classes} classes</p>
                <p className="text-sm text-muted">{log.rate ? `${money(log.rate)}/class` : "—"}</p>
                <p className="font-bold sm:text-right">{money(log.total)}</p>
              </div>
            ))}
          </div>
        </Card>
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
                  <Input type="date" defaultValue="2025-05-17" className="mt-2" />
                </label>
                <label className="text-sm font-semibold">
                  Workplace
                  <Select className="mt-2 w-full">
                    {workplaces.map((item) => (
                      <option key={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-sm font-semibold">
                  Number of classes
                  <Input type="number" defaultValue={3} className="mt-2" />
                </label>
                <label className="text-sm font-semibold">
                  Remark
                  <Input placeholder="Optional note" className="mt-2" />
                </label>
              </div>
              <div className="mt-4 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark dark:text-brand">
                <b>Estimated income: $45.00</b>
                <span className="float-right text-xs">at $15/class</span>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={saveQuickAdd}>Save classes</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

import {
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
import { supabase } from "../lib/supabase";

type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

type Workplace = {
  id: string;
  name: string;
  currency: string;
};

type GoalStatus = "Not started" | "In progress" | "Completed" | "Past due";

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getGoalStatus(goal: Goal, earned: number, today: string): GoalStatus {
  if (earned >= Number(goal.target_amount)) return "Completed";
  if (goal.end_date < today) return "Past due";
  if (goal.start_date > today) return "Not started";
  return "In progress";
}

function statusClasses(status: GoalStatus) {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (status === "Past due") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  if (status === "Not started") return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
}

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All goals");
  const today = localDateString();

  async function loadGoals() {
    setLoading(true);
    setPageError("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setPageError("Please sign in to view and manage your goals.");
        return;
      }

      const [goalResult, logResult, workplaceResult] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", userData.user.id).order("end_date", { ascending: true }),
        supabase.from("daily_logs").select("id, log_date, workplace, workplace_id, income").eq("user_id", userData.user.id),
        supabase.from("workplaces").select("id, name, currency").eq("user_id", userData.user.id),
      ]);

      if (goalResult.error) throw new Error(goalResult.error.message);
      if (logResult.error) throw new Error(logResult.error.message);
      if (workplaceResult.error) throw new Error(workplaceResult.error.message);

      setGoals((goalResult.data ?? []) as Goal[]);
      setLogs(logResult.data ?? []);
      setWorkplaces((workplaceResult.data ?? []) as Workplace[]);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "We could not load your goals. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  const workplaceById = useMemo(
    () => new Map(workplaces.map((workplace) => [workplace.id, workplace])),
    [workplaces],
  );

  function earnedForGoal(goal: Goal) {
    return logs.reduce((total, log) => {
      if (log.log_date < goal.start_date || log.log_date > goal.end_date) return total;
      const workplace = log.workplace_id
        ? workplaceById.get(log.workplace_id)
        : workplaces.find((item) => item.name === log.workplace);
      if (!workplace || workplace.currency !== goal.currency) return total;
      return total + Number(log.income ?? 0);
    }, 0);
  }

  async function saveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const targetAmount = Number(form.get("target_amount"));
    const currency = String(form.get("currency") ?? "USD").toUpperCase();
    const startDate = String(form.get("start_date") ?? "");
    const endDate = String(form.get("end_date") ?? "");

    if (!title || !Number.isFinite(targetAmount) || targetAmount <= 0 || !startDate || !endDate || endDate < startDate) {
      setPageError("Please enter a title, a target greater than zero, and a valid date range.");
      return;
    }

    setSaving(true);
    setPageError("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You must be signed in to save a goal.");

      const values = {
        title,
        description: description || null,
        target_amount: targetAmount,
        currency,
        start_date: startDate,
        end_date: endDate,
      };

      const result = editing
        ? await supabase.from("goals").update(values).eq("id", editing.id).eq("user_id", userData.user.id).select().single()
        : await supabase.from("goals").insert({ ...values, user_id: userData.user.id }).select().single();

      if (result.error) throw new Error(result.error.message);
      setGoals((previous) =>
        editing
          ? previous.map((goal) => goal.id === editing.id ? result.data as Goal : goal)
          : [...previous, result.data as Goal].sort((a, b) => a.end_date.localeCompare(b.end_date)),
      );
      setShowForm(false);
      setEditing(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save this goal.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm(`Delete "${goal.title}"? This cannot be undone.`)) return;
    setPageError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setPageError("You must be signed in to delete a goal.");
      return;
    }
    const { error } = await supabase.from("goals").delete().eq("id", goal.id).eq("user_id", userData.user.id);
    if (error) {
      setPageError(error.message);
      return;
    }
    setGoals((previous) => previous.filter((item) => item.id !== goal.id));
  }

  const goalSummaries = useMemo(() => goals.map((goal) => {
    const earned = earnedForGoal(goal);
    const target = Number(goal.target_amount);
    const remaining = Math.max(0, target - earned);
    const percent = target > 0 ? Math.min(100, Math.round((earned / target) * 100)) : 0;
    const status = getGoalStatus(goal, earned, today);
    const daysLeft = Math.max(0, Math.ceil((new Date(`${goal.end_date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000));
    const daysToWork = Math.max(1, Math.ceil((new Date(`${goal.end_date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000) + 1);
    return { goal, earned, target, remaining, percent, status, daysLeft, neededPerDay: remaining / daysToWork };
  }), [goals, logs, workplaces, workplaceById, today]);

  const filteredGoals = goalSummaries.filter(({ goal, status }) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || goal.title.toLowerCase().includes(term) || (goal.description ?? "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "All goals" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completedCount = goalSummaries.filter((item) => item.status === "Completed").length;
  const activeCount = goalSummaries.filter((item) => item.status === "In progress").length;

  function openNewGoal() {
    setEditing(null);
    setPageError("");
    setShowForm(true);
  }

  function openEditGoal(goal: Goal) {
    setEditing(goal);
    setPageError("");
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Motivation"
        title="Income goals"
        description="Set personal targets, explain what each goal is for, and track progress from your Daily Logs."
        action={<Button onClick={openNewGoal}><Plus size={16} /> New goal</Button>}
      />

      {pageError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <span>{pageError}</span>
          <Button variant="secondary" className="min-h-8 px-3 text-xs" onClick={loadGoals} disabled={loading}>Try again</Button>
        </div>
      )}

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <Target size={19} className="text-brand" />
          <p className="mt-3 text-xs text-muted">Total goals</p>
          <p className="mt-1 text-2xl font-bold">{goals.length}</p>
        </Card>
        <Card className="p-4">
          <Clock3 size={19} className="text-brand" />
          <p className="mt-3 text-xs text-muted">Currently in progress</p>
          <p className="mt-1 text-2xl font-bold">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <CheckCircle2 size={19} className="text-brand" />
          <p className="mt-3 text-xs text-muted">Completed</p>
          <p className="mt-1 text-2xl font-bold">{completedCount}</p>
        </Card>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-muted" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goals or descriptions" className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full sm:w-48">
          <option>All goals</option>
          <option>Not started</option>
          <option>In progress</option>
          <option>Completed</option>
          <option>Past due</option>
        </Select>
      </div>

      {loading ? (
        <Card className="p-8 text-sm text-muted">Loading your goals...</Card>
      ) : filteredGoals.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles size={28} className="mx-auto text-brand" />
          <h2 className="mt-3 font-bold">{goals.length === 0 ? "Start with your first goal" : "No matching goals"}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {goals.length === 0
              ? "Create a goal for something meaningful—saving for a trip, building an emergency fund, or reaching a monthly income target."
              : "Try a different search or status filter."}
          </p>
          {goals.length === 0 && <Button className="mt-4" onClick={openNewGoal}><Plus size={16} /> Create a goal</Button>}
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredGoals.map(({ goal, earned, target, remaining, percent, status, daysLeft, neededPerDay }) => (
            <Card key={goal.id} className="overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}>{status}</span>
                    <h2 className="mt-3 break-words text-lg font-bold">{goal.title}</h2>
                    {goal.description && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{goal.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Edit goal" onClick={() => openEditGoal(goal)}><Pencil size={16} /></Button>
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-600 hover:text-red-700" aria-label="Delete goal" onClick={() => deleteGoal(goal)}><Trash2 size={16} /></Button>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">Income progress</p>
                    <p className="mt-1 text-2xl font-bold">{formatMoney(earned, goal.currency)} <span className="text-sm font-medium text-muted">of {formatMoney(target, goal.currency)}</span></p>
                  </div>
                  <p className="text-xl font-bold text-brand">{percent}%</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-xs text-muted">Still needed</p>
                    <p className="mt-1 font-bold">{formatMoney(remaining, goal.currency)}</p>
                  </div>
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-xs text-muted">{status === "Completed" ? "Status" : "Needed per day"}</p>
                    <p className="mt-1 font-bold">{status === "Completed" ? "Target reached" : formatMoney(neededPerDay, goal.currency)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><CalendarRange size={14} /> {formatDate(goal.start_date)} – {formatDate(goal.end_date)}</span>
                  <span>{status === "Completed" ? "Well done!" : status === "Past due" ? "Deadline passed" : status === "Not started" ? "Starts soon" : `${daysLeft} days remaining`}</span>
                </div>
                {status === "In progress" && remaining > 0 && (
                  <p className="mt-3 text-xs text-muted">To reach this target by the deadline, aim to earn about <strong className="text-ink">{formatMoney(neededPerDay, goal.currency)}</strong> per calendar day from now on.</p>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={() => { if (!saving) { setShowForm(false); setEditing(null); } }}>
          <Card className="my-auto w-full max-w-xl rounded-b-none p-5 sm:rounded-2xl sm:p-6">
            <form onSubmit={saveGoal} onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{editing ? "Edit goal" : "Create a goal"}</h2>
                  <p className="mt-1 text-sm text-muted">Give your goal a clear name and explain what you're working toward.</p>
                </div>
                <button type="button" className="rounded-lg px-3 py-1 text-sm text-muted hover:bg-soft" onClick={() => { setShowForm(false); setEditing(null); }} disabled={saving}>Close</button>
              </div>

              {pageError && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{pageError}</div>}

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">Goal name
                  <Input name="title" required maxLength={100} placeholder="e.g. Emergency fund" defaultValue={editing?.title ?? ""} className="mt-2" />
                </label>
                <label className="block text-sm font-semibold">What is this goal about?
                  <textarea name="description" rows={3} maxLength={1000} defaultValue={editing?.description ?? ""} placeholder="Describe why this goal matters or what you plan to use the money for..." className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/10" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Target amount
                    <Input name="target_amount" type="number" min="0.01" step="0.01" required defaultValue={editing ? String(editing.target_amount) : ""} placeholder="e.g. 50000" className="mt-2" />
                  </label>
                  <label className="block text-sm font-semibold">Currency
                    <Select name="currency" defaultValue={editing?.currency ?? (workplaces[0]?.currency ?? "PHP")} className="mt-2 w-full">
                      {[...new Set(["PHP", "USD", ...workplaces.map((item) => item.currency)])].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                    </Select>
                  </label>
                  <label className="block text-sm font-semibold">Start date
                    <Input name="start_date" type="date" required defaultValue={editing?.start_date ?? today} className="mt-2" />
                  </label>
                  <label className="block text-sm font-semibold">Target date
                    <Input name="end_date" type="date" required min={editing?.start_date ?? today} defaultValue={editing?.end_date ?? today} className="mt-2" />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create goal"}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}


import {
  Archive,
  CalendarClock,
  ChevronRight,
  Coins,
  Pencil,
  Plus,
  RotateCcw,
  CircleHelp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
import { money } from "../lib/utils";
import { supabase } from "../lib/supabase";

type Workplace = {
  id: string;
  user_id: string;
  name: string;
  short_name: string;
  color: string;
  currency: string;
  rate: number;
  rate_effective: string;
  schedule: string;
  payday: string;
  cutoff_rule: string;
  archived: boolean;
  cutoff_day_of_week: number | null;
  payday_type: "day_of_week" | "day_of_month" | "days_after_cutoff" | "no_fixed_date";
  payday_day_of_week: number | null;
  payday_day_of_month: number | null;
  payday_offset_days: number | null;
  payment_notes: string | null;
};

type WorkplaceFormValues = {
  name: string;
  currency: string;
  rate: number;
  rate_effective: string;
  schedule: string;
  payday: string;
  cutoff_rule: string;
  cutoff_day_of_week: number | null;
  payday_type: "day_of_week" | "day_of_month" | "days_after_cutoff" | "no_fixed_date";
  payday_day_of_week: number | null;
  payday_day_of_month: number | null;
  payday_offset_days: number | null;
  payment_notes: string | null;
};

const today = new Date().toISOString().slice(0, 10);

function formatRate(rate: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(rate);
}

export function WorkplacesPage() {
  const [items, setItems] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [editing, setEditing] = useState<Workplace | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [savingArchive, setSavingArchive] = useState<string | null>(null);

  // Load the signed-in user's workplaces from Supabase.
  useEffect(() => {
    async function loadWorkplaces() {
      setLoading(true);
      setPageError("");

      const { data, error } = await supabase
        .from("workplaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        setPageError(error.message);
        setLoading(false);
        return;
      }

      setItems((data ?? []) as Workplace[]);
      setLoading(false);
    }

    loadWorkplaces();
  }, []);

  // Add a new workplace or update an existing one.
  async function saveWorkplace(
    values: WorkplaceFormValues,
    existingItem?: Workplace,
  ): Promise<string | null> {
    setPageError("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return "You must be logged in to save a workplace.";
    }

    const words = values.name.trim().split(/\s+/);
    const shortName =
      words.length > 1
        ? words.map((word) => word[0]).join("").slice(0, 2).toUpperCase()
        : values.name.trim().slice(0, 2).toUpperCase();

    const workplaceData = {
      name: values.name.trim(),
      short_name: shortName,
      color: existingItem?.color ?? "#5B8DEF",
      currency: values.currency,
      rate: values.rate,
      rate_effective: values.rate_effective,
      schedule: values.schedule,
      payday: values.payday,
      cutoff_rule: values.cutoff_rule,
      cutoff_day_of_week: values.cutoff_day_of_week,
      payday_type: values.payday_type,
      payday_day_of_week: values.payday_day_of_week,
      payday_day_of_month: values.payday_day_of_month,
      payday_offset_days: values.payday_offset_days,
      payment_notes: values.payment_notes,
    };

    if (existingItem) {
      const { data, error } = await supabase
        .from("workplaces")
        .update(workplaceData)
        .eq("id", existingItem.id)
        .select()
        .single();

      if (error) return error.message;

      setItems((previous) =>
        previous.map((item) => (item.id === existingItem.id ? data : item)),
      );
    } else {
      const { data, error } = await supabase
        .from("workplaces")
        .insert({
          ...workplaceData,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) return error.message;

      setItems((previous) => [...previous, data]);
    }

    return null;
  }

  // Archive or restore a workplace in the database.
  async function toggleArchive(item: Workplace) {
    setPageError("");
    setSavingArchive(item.id);

    const { data, error } = await supabase
      .from("workplaces")
      .update({ archived: !item.archived })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      setPageError(error.message);
      setSavingArchive(null);
      return;
    }

    setItems((previous) =>
      previous.map((workplace) =>
        workplace.id === item.id ? data : workplace,
      ),
    );

    setSavingArchive(null);
  }

  const visible = items.filter((item) =>
    showArchived ? item.archived : !item.archived,
  );

  return (
    <>
      <PageHeader
        eyebrow="Setup"
        title="Workplaces & rates"
        description="Each school keeps its own rate history, currency, cutoff, and payday."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} /> Add workplace
          </Button>
        }
      />

      {pageError && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {pageError}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">
          {visible.length} {showArchived ? "archived" : "active"} workplaces
        </p>

        <button
          className="text-sm font-semibold text-brand-dark dark:text-brand"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? "Show active" : "View archived"}
        </button>
      </div>

      {loading ? (
        <Card className="p-6 text-sm text-muted">
          Loading workplaces...
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="font-bold">No workplaces found</h2>
          <p className="mt-1 text-sm text-muted">
            {showArchived
              ? "You don't have any archived workplaces."
              : "Add your first workplace to get started."}
          </p>
          {!showArchived && (
            <Button className="mt-4" onClick={() => setEditing("new")}>
              <Plus size={16} /> Add workplace
            </Button>
          )}
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: item.color }}
                >
                  {item.short_name}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">{item.name}</h2>
                  <p className="text-xs text-muted">
                    {item.currency} · {item.schedule}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-soft p-3">
                  <Coins size={16} className="text-brand" />
                  <p className="mt-3 text-xs text-muted">Current rate</p>
                  <p className="mt-1 font-bold">
                    {formatRate(Number(item.rate), item.currency)}
                    <span className="text-xs font-normal text-muted">
                      {" "}/ class
                    </span>
                  </p>
                </div>

                <div className="rounded-xl bg-soft p-3">
                  <CalendarClock size={16} className="text-brand" />
                  <p className="mt-3 text-xs text-muted">Payday</p>
                  <p className="mt-1 text-sm font-bold">{item.payday}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <p className="text-xs text-muted">Rate effective from</p>
                  <p className="text-sm font-semibold">
                    {item.rate_effective}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={() => setEditing(item)}
                >
                  <Pencil size={15} /> Edit
                </Button>
              </div>

              <button
                disabled={savingArchive === item.id}
                onClick={() => toggleArchive(item)}
                className="mt-3 flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold text-muted hover:bg-soft disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  {item.archived ? (
                    <>
                      <RotateCcw size={14} /> Restore workplace
                    </>
                  ) : (
                    <>
                      <Archive size={14} /> Archive workplace
                    </>
                  )}
                </span>

                {savingArchive === item.id ? (
                  <span>Saving...</span>
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            </Card>
          ))}
        </section>
      )}

      <Card className="mt-6 p-5">
        <h2 className="font-bold">Defaults</h2>
        <p className="mt-1 text-xs text-muted">
          These are display defaults for now. They are not saved to your account yet.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Default currency
            <Select className="mt-2 w-full" defaultValue="USD">
              <option value="USD">USD — US Dollar</option>
              <option value="PHP">PHP — Philippine Peso</option>
              <option value="EUR">EUR — Euro</option>
            </Select>
          </label>

          <label className="text-sm font-semibold">
            Timezone
            <Select className="mt-2 w-full" defaultValue="Asia/Manila">
              <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </Select>
          </label>
        </div>
      </Card>

      {editing && (
        <WorkplaceModal
          item={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
          save={saveWorkplace}
        />
      )}
    </>
  );
}

const weekdays = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

type PaydayType =
  | "day_of_week"
  | "day_of_month"
  | "days_after_cutoff"
  | "no_fixed_date";

function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="More information"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-brand"
      >
        <CircleHelp size={15} />
      </button>
      <span
        role="tooltip"
        className={`absolute left-0 top-7 z-[90] w-64 rounded-xl border border-line bg-surface p-3 text-xs font-normal leading-relaxed text-ink shadow-xl ${open ? "block" : "hidden"} group-hover:block group-focus-within:block`}
      >
        {text}
      </span>
    </span>
  );
}

function WorkplaceModal({
  item,
  close,
  save,
}: {
  item?: Workplace;
  close: () => void;
  save: (
    values: WorkplaceFormValues,
    existingItem?: Workplace,
  ) => Promise<string | null>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [currency, setCurrency] = useState(item?.currency ?? "USD");
  const [rate, setRate] = useState(String(item?.rate ?? 13));
  const [rateEffective, setRateEffective] = useState(
    item?.rate_effective ?? today,
  );
  const [schedule, setSchedule] = useState(item?.schedule ?? "Weekly");
  const [cutoffDay, setCutoffDay] = useState(
    String(item?.cutoff_day_of_week ?? 7),
  );
  const [cutoffRule, setCutoffRule] = useState(
    item?.cutoff_rule ?? "End of month",
  );
  const [paydayType, setPaydayType] = useState<PaydayType>(
    item?.payday_type ?? "no_fixed_date",
  );
  const [paydayWeekday, setPaydayWeekday] = useState(
    String(item?.payday_day_of_week ?? 5),
  );
  const [paydayMonthDay, setPaydayMonthDay] = useState(
    String(item?.payday_day_of_month ?? 15),
  );
  const [paydayOffset, setPaydayOffset] = useState(
    String(item?.payday_offset_days ?? 7),
  );
  const [paymentNotes, setPaymentNotes] = useState(item?.payment_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isWeeklySchedule = schedule === "Weekly" || schedule === "Bi-weekly";
  const selectedCutoffDay = weekdays.find(
    (day) => day.value === Number(cutoffDay),
  )?.label ?? "Sunday";

  function getPaydayDescription() {
    if (paydayType === "day_of_week") {
      const day = weekdays.find(
        (option) => option.value === Number(paydayWeekday),
      )?.label ?? "Friday";
      return day + " after cutoff";
    }
    if (paydayType === "day_of_month") {
      return "Day " + paydayMonthDay + " of each month";
    }
    if (paydayType === "days_after_cutoff") {
      return paydayOffset + " days after cutoff";
    }
    return "No fixed payday";
  }

  function getCutoffDescription() {
    if (isWeeklySchedule) {
      return (schedule === "Weekly" ? "Every " : "Every other ") + selectedCutoffDay;
    }
    return cutoffRule;
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter a workplace name.");
      return;
    }

    if (!rate.trim() || !Number.isFinite(Number(rate)) || Number(rate) < 0) {
      setError("Please enter a valid rate of zero or more.");
      return;
    }

    if (!rateEffective) {
      setError("Please select when this rate becomes effective.");
      return;
    }

    if (
      paydayType === "day_of_month" &&
      (!Number.isInteger(Number(paydayMonthDay)) ||
        Number(paydayMonthDay) < 1 ||
        Number(paydayMonthDay) > 31)
    ) {
      setError("Please choose a payday between the 1st and 31st.");
      return;
    }

    if (
      paydayType === "days_after_cutoff" &&
      (!Number.isInteger(Number(paydayOffset)) ||
        Number(paydayOffset) < 0 ||
        Number(paydayOffset) > 60)
    ) {
      setError("Please enter between 0 and 60 days after cut-off.");
      return;
    }

    setSaving(true);
    setError("");

    const result = await save(
      {
        name,
        currency,
        rate: Number(rate),
        rate_effective: rateEffective,
        schedule,
        payday: getPaydayDescription(),
        cutoff_rule: getCutoffDescription(),
        cutoff_day_of_week: isWeeklySchedule ? Number(cutoffDay) : null,
        payday_type: paydayType,
        payday_day_of_week:
          paydayType === "day_of_week" ? Number(paydayWeekday) : null,
        payday_day_of_month:
          paydayType === "day_of_month" ? Number(paydayMonthDay) : null,
        payday_offset_days:
          paydayType === "days_after_cutoff" ? Number(paydayOffset) : null,
        payment_notes: paymentNotes.trim() || null,
      },
      item,
    );

    setSaving(false);

    if (result) {
      setError(result);
      return;
    }

    close();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={close}
    >
      <Card className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-b-none p-5 sm:rounded-2xl">
        <div onMouseDown={(event) => event.stopPropagation()}>
          <h2 className="text-xl font-bold">
            {item ? "Edit workplace" : "Add a workplace"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Set this workplace's rate and payment arrangements.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Workplace name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Bright English"
                className="mt-2"
              />
            </label>

            <label className="text-sm font-semibold">
              Currency
              <Select
                className="mt-2 w-full"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
              </Select>
            </label>

            <label className="text-sm font-semibold">
              Rate per class
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="mt-2"
              />
            </label>

            <label className="text-sm font-semibold">
              Effective from
              <Input
                type="date"
                value={rateEffective}
                onChange={(event) => setRateEffective(event.target.value)}
                className="mt-2"
              />
            </label>

            <div>
              <div className="flex items-center text-sm font-semibold">
                Pay schedule
                <HelpTip text="How often this workplace calculates and sends your payment. Choose the schedule stated by your school or tutoring platform." />
              </div>
              <Select
                className="mt-2 w-full"
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
              >
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly (every two weeks)</option>
                <option value="Semi-monthly">Semi-monthly (twice a month)</option>
                <option value="Monthly">Monthly</option>
              </Select>
            </div>

            {isWeeklySchedule ? (
              <div>
                <div className="flex items-center text-sm font-semibold">
                  Cut-off day
                  <HelpTip text="The last day included in a payment period. For example, if your weekly cut-off is Sunday, classes from Monday through Sunday belong to that period." />
                </div>
                <Select
                  className="mt-2 w-full"
                  value={cutoffDay}
                  onChange={(event) => setCutoffDay(event.target.value)}
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <div className="flex items-center text-sm font-semibold">
                  Cut-off arrangement
                  <HelpTip text="For semi-monthly or monthly schedules, choose the date pattern your workplace uses to close each payment period." />
                </div>
                <Select
                  className="mt-2 w-full"
                  value={cutoffRule}
                  onChange={(event) => setCutoffRule(event.target.value)}
                >
                  <option value="1st and 15th">1st and 15th</option>
                  <option value="15th and last day">15th and last day</option>
                  <option value="End of month">End of month</option>
                </Select>
              </div>
            )}

            <div className="sm:col-span-2">
              <div className="flex items-center text-sm font-semibold">
                Payday arrangement
                <HelpTip text="Choose how the workplace determines the day it sends your payment. This is separate from the cut-off day." />
              </div>
              <Select
                className="mt-2 w-full"
                value={paydayType}
                onChange={(event) =>
                  setPaydayType(event.target.value as PaydayType)
                }
              >
                <option value="day_of_week">A specific weekday</option>
                <option value="day_of_month">A date of each month</option>
                <option value="days_after_cutoff">A number of days after cut-off</option>
                <option value="no_fixed_date">No fixed payday</option>
              </Select>
            </div>

            {paydayType === "day_of_week" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">
                  Payday weekday
                  <Select
                    className="mt-2 w-full"
                    value={paydayWeekday}
                    onChange={(event) => setPaydayWeekday(event.target.value)}
                  >
                    {weekdays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            )}

            {paydayType === "day_of_month" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">
                  Payday date (1–31)
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={paydayMonthDay}
                    onChange={(event) => setPaydayMonthDay(event.target.value)}
                    className="mt-2"
                  />
                </label>
              </div>
            )}

            {paydayType === "days_after_cutoff" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">
                  Days after cut-off
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={paydayOffset}
                    onChange={(event) => setPaydayOffset(event.target.value)}
                    className="mt-2"
                  />
                </label>
              </div>
            )}

            <label className="text-sm font-semibold sm:col-span-2">
              Payment notes (optional)
              <textarea
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="e.g. Payment may be delayed on public holidays."
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl bg-soft p-3 text-sm">
            <p className="font-semibold">Payment summary</p>
            <p className="mt-1 text-muted">
              {schedule} · {getCutoffDescription()} cut-off · {getPaydayDescription()}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={saving}>
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save workplace"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

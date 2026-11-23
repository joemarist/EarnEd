import {
  Archive,
  CalendarClock,
  ChevronRight,
  Coins,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
import { Workplace, workplaces as initialWorkplaces } from "../data/mock";
import { money } from "../lib/utils";

export function WorkplacesPage() {
  const [items, setItems] = useState(initialWorkplaces);
  const [editing, setEditing] = useState<Workplace | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const visible = items.filter((item) => (showArchived ? item.archived : !item.archived));

  function toggleArchive(id: string) {
    setItems(items.map((item) => (item.id === id ? { ...item, archived: !item.archived } : item)));
  }

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
      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visible.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: item.color }}
              >
                {item.shortName}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{item.name}</h2>
                <p className="text-xs text-muted">
                  {item.currency} · {item.schedule}
                </p>
              </div>
              <Button variant="ghost" className="h-9 w-9 px-0">
                <MoreHorizontal size={18} />
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-soft p-3">
                <Coins size={16} className="text-brand" />
                <p className="mt-3 text-xs text-muted">Current rate</p>
                <p className="mt-1 font-bold">
                  {money(item.rate)} <span className="text-xs font-normal text-muted">/ class</span>
                </p>
              </div>
              <div className="rounded-xl bg-soft p-3">
                <CalendarClock size={16} className="text-brand" />
                <p className="mt-3 text-xs text-muted">Next payday</p>
                <p className="mt-1 font-bold">{item.payday}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-muted">Rate effective from</p>
                <p className="text-sm font-semibold">{item.rateEffective}</p>
              </div>
              <Button variant="ghost" className="h-9 px-2" onClick={() => setEditing(item)}>
                <Pencil size={15} /> Edit
              </Button>
            </div>
            <button
              onClick={() => toggleArchive(item.id)}
              className="mt-3 flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold text-muted hover:bg-soft"
            >
              {item.archived ? (
                <>
                  <span className="flex items-center gap-2">
                    <RotateCcw size={14} /> Restore workplace
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Archive size={14} /> Archive workplace
                  </span>
                </>
              )}
              <ChevronRight size={14} />
            </button>
          </Card>
        ))}
      </section>

      <Card className="mt-6 p-5">
        <h2 className="font-bold">Defaults</h2>
        <p className="mt-1 text-xs text-muted">Used when creating a new workplace or report.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Default currency
            <Select className="mt-2 w-full">
              <option>USD — US Dollar</option>
              <option>PHP — Philippine Peso</option>
              <option>EUR — Euro</option>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Timezone
            <Select className="mt-2 w-full">
              <option>Asia/Manila (GMT+8)</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
            </Select>
          </label>
        </div>
      </Card>

      {editing && (
        <WorkplaceModal
          item={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
          save={(name) => {
            if (editing === "new")
              setItems([
                ...items,
                {
                  id: `workplace-${items.length + 1}`,
                  name,
                  shortName: name.slice(0, 2).toUpperCase(),
                  color: "#5B8DEF",
                  currency: "USD",
                  rate: 13,
                  rateEffective: "May 13, 2025",
                  schedule: "Bi-weekly",
                  payday: "May 30",
                },
              ]);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function WorkplaceModal({
  item,
  close,
  save,
}: {
  item?: Workplace;
  close: () => void;
  save: (name: string) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={close}
    >
      <Card className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-b-none p-5 sm:rounded-2xl">
        <div onMouseDown={(event) => event.stopPropagation()}>
          <h2 className="text-xl font-bold">{item ? "Edit workplace" : "Add a workplace"}</h2>
          <p className="mt-1 text-sm text-muted">
            You can add more rates later without changing past earnings.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Workplace name
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bright English"
                className="mt-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Currency
              <Select className="mt-2 w-full" defaultValue={item?.currency}>
                <option>USD</option>
                <option>PHP</option>
                <option>EUR</option>
              </Select>
            </label>
            <label className="text-sm font-semibold">
              Rate per class
              <Input type="number" defaultValue={item?.rate ?? 13} className="mt-2" />
            </label>
            <label className="text-sm font-semibold">
              Effective from
              <Input type="date" defaultValue="2025-05-13" className="mt-2" />
            </label>
            <label className="text-sm font-semibold">
              Pay schedule
              <Select className="mt-2 w-full" defaultValue={item?.schedule}>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Semi-monthly</option>
                <option>Monthly</option>
              </Select>
            </label>
            <label className="text-sm font-semibold">
              Payday
              <Select className="mt-2 w-full">
                <option>Friday after cutoff</option>
                <option>15th and last day</option>
                <option>Last business day</option>
              </Select>
            </label>
            <label className="text-sm font-semibold">
              Cutoff rule
              <Select className="mt-2 w-full">
                <option>Every other Sunday</option>
                <option>15th and last day</option>
                <option>End of month</option>
              </Select>
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button disabled={!name.trim()} onClick={() => save(name)}>
              Save workplace
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

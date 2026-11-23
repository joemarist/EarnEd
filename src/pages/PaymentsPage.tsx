import { AlertCircle, CalendarCheck, Download, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components/ui";
import { periods, workplaces } from "../data/mock";
import { downloadText, money } from "../lib/utils";

export function PaymentsPage() {
  const [selected, setSelected] = useState("all");
  const [recording, setRecording] = useState(false);
  const filtered =
    selected === "all"
      ? periods
      : periods.filter(
          (period) => period.workplace === workplaces.find((item) => item.id === selected)?.name,
        );
  const csv = [
    "Workplace,Period,Expected,Received,Balance,Status",
    ...periods.map(
      (item) =>
        `${item.workplace},${item.period},${item.expected},${item.received},${item.balance},${item.status}`,
    ),
  ].join("\n");

  return (
    <>
      <PageHeader
        eyebrow="Reconciliation"
        title="Payments"
        description="Compare expected pay with what arrived. Shortfalls remain visible until they’re cleared."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => downloadText("earned-payments.csv", csv)}>
              <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={() => setRecording(true)}>
              <Plus size={16} /> Record payment
            </Button>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Expected this month", "$2,650.00", "43 classes across 3 workplaces", TrendingUp],
          ["Payments received", "$2,180.00", "82.3% of expected income", CalendarCheck],
          ["Outstanding balance", "$470.00", "$390 overdue · $80 shortfall", AlertCircle],
        ].map(([label, value, detail, Icon], index) => (
          <Card key={String(label)} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{String(label)}</p>
                <p className="mt-2 text-2xl font-bold">{String(value)}</p>
              </div>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-950" : "bg-brand-soft text-brand-dark"}`}
              >
                {<Icon size={19} />}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">{String(detail)}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Pay periods</h2>
            <p className="text-xs text-muted">Running balances include any unpaid shortfall</p>
          </div>
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="all">All workplaces</option>
            {workplaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Workplace</th>
                <th className="px-4 py-3">Pay period</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Date received</th>
                <th className="px-4 py-3">Balance owed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((item) => (
                <tr key={item.workplace + item.period} className="hover:bg-soft/60">
                  <td className="px-5 py-4 font-semibold">{item.workplace}</td>
                  <td className="px-4 py-4 text-muted">{item.period}</td>
                  <td className="px-4 py-4">{money(item.expected)}</td>
                  <td className="px-4 py-4">{money(item.received)}</td>
                  <td className="px-4 py-4 text-muted">{item.receivedDate}</td>
                  <td
                    className={`px-4 py-4 font-bold ${item.balance ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {money(item.balance)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-5 border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={19} />
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200">How shortfalls work</h3>
            <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-200/70">
              If a payment is less than expected, the difference stays in the running balance for
              that workplace. Add a later payment to reduce or clear it.
            </p>
          </div>
        </div>
      </Card>

      {recording && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onMouseDown={() => setRecording(false)}
        >
          <Card className="w-full max-w-lg rounded-b-none p-5 sm:rounded-2xl">
            <div onMouseDown={(event) => event.stopPropagation()}>
              <h2 className="text-xl font-bold">Record a payment</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Workplace
                  <Select className="mt-2 w-full">
                    {workplaces.map((item) => (
                      <option key={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-sm font-semibold">
                  Amount received
                  <Input type="number" placeholder="$0.00" className="mt-2" />
                </label>
                <label className="text-sm font-semibold">
                  Date received
                  <Input type="date" className="mt-2" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Pay period
                  <Select className="mt-2 w-full">
                    {periods.map((item) => (
                      <option key={item.workplace + item.period}>
                        {item.period} · {item.workplace}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRecording(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setRecording(false)}>Save payment</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

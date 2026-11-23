import { Download, FileSpreadsheet, FileText, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, PageHeader, Select } from "../components/ui";
import { monthlyIncome, workplaces } from "../data/mock";
import { downloadText, money } from "../lib/utils";

export function ReportsPage() {
  const exportCsv = () =>
    downloadText(
      "earned-income-report.csv",
      [
        "Month,Earned,Received",
        ...monthlyIncome.map((item) => `${item.month},${item.earned},${item.received}`),
      ].join("\n"),
    );
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Earnings reports"
        description="Understand your trends by class, month, and workplace."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCsv}>
              <FileSpreadsheet size={16} /> CSV
            </Button>
            <Button onClick={() => window.print()}>
              <FileText size={16} /> PDF
            </Button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <Select>
          <option>Last 6 months</option>
          <option>This year</option>
          <option>Custom range</option>
        </Select>
        <Select>
          <option>All workplaces</option>
          {workplaces.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </Select>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Average monthly income", "$2,050", "+15.2% over 6 months"],
          ["Average per class", "$12.84", "+$0.75 since January"],
          ["Highest month", "$2,650", "May 2025"],
        ].map(([label, value, detail]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp size={14} />
              {detail}
            </p>
          </Card>
        ))}
      </section>
      <Card className="mt-5 p-5">
        <div>
          <h2 className="font-bold">Income trend</h2>
          <p className="text-xs text-muted">Total earned by month</p>
        </div>
        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyIncome}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#76BE3F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#76BE3F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Area
                type="monotone"
                dataKey="earned"
                stroke="#76BE3F"
                strokeWidth={3}
                fill="url(#incomeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h2 className="font-bold">Per-class report</h2>
            <p className="text-xs text-muted">Average rate and volume by workplace</p>
          </div>
          <Button variant="ghost" onClick={exportCsv}>
            <Download size={15} /> Download
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Workplace</th>
                <th className="px-4 py-3">Classes</th>
                <th className="px-4 py-3">Avg. rate</th>
                <th className="px-4 py-3">Earnings</th>
                <th className="px-4 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {workplaces.map((item, index) => {
                const classes = [102, 63, 43][index];
                const earnings = classes * item.rate;
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold">{item.name}</td>
                    <td className="px-4 py-4">{classes}</td>
                    <td className="px-4 py-4">{money(item.rate)}</td>
                    <td className="px-4 py-4 font-bold">{money(earnings)}</td>
                    <td className="px-4 py-4">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-soft">
                        <div
                          className="h-full rounded-full"
                          style={{ background: item.color, width: `${[54, 31, 15][index]}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

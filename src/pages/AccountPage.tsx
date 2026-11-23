import {
  Bell,
  Check,
  CloudDownload,
  Download,
  FileSpreadsheet,
  Globe2,
  Link2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
import { dailyLogs, periods } from "../data/mock";
import { downloadText } from "../lib/utils";

export function AccountPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [share, setShare] = useState(false);
  const [imported, setImported] = useState("");
  const [saved, setSaved] = useState(false);
  function exportAll() {
    downloadText(
      "earned-data-export.json",
      JSON.stringify({ dailyLogs, payments: periods }, null, 2),
      "application/json",
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Preferences"
        title="Profile & account"
        description="Manage your profile, reminders, privacy, and data."
        action={
          saved ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-brand-dark dark:text-brand">
              <Check size={16} /> Changes saved
            </span>
          ) : undefined
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <UserRound size={19} />
              </span>
              <div>
                <h2 className="font-bold">Personal details</h2>
                <p className="text-xs text-muted">Visible only to you</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Full name
                <Input defaultValue="Mia Santos" className="mt-2" />
              </label>
              <label className="text-sm font-semibold">
                Email address
                <Input defaultValue="mia@example.com" className="mt-2" disabled />
              </label>
              <label className="text-sm font-semibold">
                Default currency
                <Select className="mt-2 w-full">
                  <option>USD — US Dollar</option>
                  <option>PHP — Philippine Peso</option>
                </Select>
              </label>
              <label className="text-sm font-semibold">
                Timezone
                <Select className="mt-2 w-full">
                  <option>Asia/Manila (GMT+8)</option>
                  <option>America/New_York</option>
                </Select>
              </label>
            </div>
            <Button
              className="mt-5"
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              Save changes
            </Button>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950">
                <Bell size={19} />
              </span>
              <div>
                <h2 className="font-bold">Reminders</h2>
                <p className="text-xs text-muted">Choose the updates you want to receive</p>
              </div>
            </div>
            <div className="mt-4 divide-y divide-line">
              {[
                ["Payday reminders", "One day before each workplace payday", true],
                ["Overdue payment alerts", "When a payment has not arrived by its due date", true],
                ["Monthly income summary", "A recap on the first day of each month", true],
                ["Goal check-ins", "A weekly update on your active target", false],
              ].map(([title, detail, checked]) => (
                <label key={String(title)} className="flex cursor-pointer items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{String(title)}</p>
                    <p className="mt-0.5 text-xs text-muted">{String(detail)}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={Boolean(checked)}
                    className="h-5 w-5 accent-[#76BE3F]"
                  />
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950">
                <Link2 size={19} />
              </span>
              <div>
                <h2 className="font-bold">Read-only share link</h2>
                <p className="text-xs text-muted">
                  Share a private summary without exposing class details
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 rounded-xl border border-line bg-soft px-3 py-3 text-sm text-muted">
                {share ? "earned.app/share/mia-demo-8f2c" : "Link is currently disabled"}
              </div>
              <Button variant={share ? "secondary" : "primary"} onClick={() => setShare(!share)}>
                {share ? "Disable link" : "Create link"}
              </Button>
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-brand" />
              <div>
                <h2 className="font-bold">Import existing tracker</h2>
                <p className="text-xs text-muted">Excel or CSV · preview before importing</p>
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => setImported(event.target.files?.[0]?.name ?? "")}
            />
            <button
              onClick={() => fileInput.current?.click()}
              className="mt-5 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-line p-7 text-center transition hover:border-brand hover:bg-brand-soft/30"
            >
              <Upload size={24} className="text-brand" />
              <span className="mt-3 text-sm font-semibold">
                {imported || "Choose your spreadsheet"}
              </span>
              <span className="mt-1 text-xs text-muted">
                {imported ? "Ready to map columns" : "Up to 10 MB"}
              </span>
            </button>
            {imported && <Button className="mt-3 w-full">Continue to column mapping</Button>}
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CloudDownload size={20} className="text-brand" />
              <div>
                <h2 className="font-bold">Export your data</h2>
                <p className="text-xs text-muted">Download a portable copy anytime</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  downloadText(
                    "earned-classes.csv",
                    "date,workplace,classes,rate,total\n" +
                      dailyLogs
                        .map(
                          (item) =>
                            `${item.date},${item.workplace},${item.classes},${item.rate},${item.total}`,
                        )
                        .join("\n"),
                  )
                }
              >
                <Download size={16} /> CSV
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Download size={16} /> PDF
              </Button>
            </div>
            <Button variant="ghost" className="mt-2 w-full" onClick={exportAll}>
              Export all account data
            </Button>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="rounded-xl bg-soft p-4">
                <Moon size={18} className="text-brand" />
                <p className="mt-3 text-sm font-semibold">Appearance</p>
                <p className="mt-1 text-xs text-muted">Use the header toggle for dark mode.</p>
              </div>
              <div className="rounded-xl bg-soft p-4">
                <Globe2 size={18} className="text-brand" />
                <p className="mt-3 text-sm font-semibold">Install EarnEd</p>
                <p className="mt-1 text-xs text-muted">Add to your home screen for quick access.</p>
              </div>
            </div>
          </Card>
          <Card className="border-red-200 p-5 sm:p-6 dark:border-red-950">
            <div className="flex items-center gap-3">
              <Trash2 size={19} className="text-red-600" />
              <div>
                <h2 className="font-bold">Delete account</h2>
                <p className="text-xs text-muted">
                  Your data is soft-deleted before permanent removal.
                </p>
              </div>
            </div>
            <Button variant="danger" className="mt-5">
              Request account deletion
            </Button>
          </Card>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} /> Private by default
        </span>
        <span className="flex items-center gap-1.5">
          <LockKeyhole size={14} /> Secure sessions planned
        </span>
      </div>
    </>
  );
}

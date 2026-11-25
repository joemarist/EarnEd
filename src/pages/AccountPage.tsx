import {
  Camera,
  Check,
  CloudDownload,
  Download,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, PageHeader, Select } from "../components/ui";
import { downloadText } from "../lib/utils";

type ReminderPreferences = {
  payday: boolean;
  overdue: boolean;
  monthly: boolean;
  goals: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
};

const defaultReminders: ReminderPreferences = {
  payday: true,
  overdue: true,
  monthly: true,
  goals: false,
  in_app_enabled: true,
  email_enabled: false,
};

const currencies = [
  ["USD", "USD — US Dollar"],
  ["PHP", "PHP — Philippine Peso"],
  ["EUR", "EUR — Euro"],
  ["GBP", "GBP — British Pound"],
  ["CAD", "CAD — Canadian Dollar"],
  ["AUD", "AUD — Australian Dollar"],
  ["SGD", "SGD — Singapore Dollar"],
  ["JPY", "JPY — Japanese Yen"],
  ["INR", "INR — Indian Rupee"],
];

const timezones = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [reminders, setReminders] = useState<ReminderPreferences>(defaultReminders);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("earned-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem("earned-theme", darkMode ? "dark" : "light"); } catch { /* Theme still applies for this session. */ }
  }, [darkMode]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageError, setPageError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      setLoading(true);
      setPageError("");
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw new Error(error?.message || "Please sign in to view your account.");

        if (active) {
          const metadata = data.user.user_metadata ?? {};
          setUser(data.user);
          setFullName(metadata.full_name || metadata.name || "");
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("avatar_path, updated_at")
            .eq("user_id", data.user.id)
            .maybeSingle();
          const storedAvatar = profile?.avatar_path
            ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl +
              `?v=${encodeURIComponent(profile.updated_at || data.user.updated_at || Date.now())}`
            : "";
          setAvatarUrl(storedAvatar || metadata.avatar_url || metadata.picture || "");
          setDefaultCurrency(metadata.default_currency || "USD");
          setTimezone(metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
          const { data: savedPreferences } = await supabase
            .from("notification_preferences")
            .select("payday, overdue, monthly, goals, in_app_enabled, email_enabled")
            .eq("user_id", data.user.id)
            .maybeSingle();
          setReminders({ ...defaultReminders, ...(metadata.reminder_preferences ?? {}), ...(savedPreferences ?? {}) });
        }
      } catch (error) {
        if (active) setPageError(error instanceof Error ? error.message : "We could not load your account.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccount();
    return () => { active = false; };
  }, []);

  async function handleSaveChanges() {
    setSaving(true);
    setSaved(false);
    setPageError("");

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        name: fullName.trim(),
        default_currency: defaultCurrency,
        timezone,
        reminder_preferences: { payday: reminders.payday, overdue: reminders.overdue, monthly: reminders.monthly, goals: reminders.goals },
      },
    });

    if (error) {
      setPageError(error.message);
    } else {
      const { error: preferencesError } = await supabase.from("notification_preferences").upsert({
        user_id: data.user.id,
        payday: reminders.payday,
        overdue: reminders.overdue,
        monthly: reminders.monthly,
        goals: reminders.goals,
        in_app_enabled: reminders.in_app_enabled,
        email_enabled: reminders.email_enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (preferencesError) setPageError(preferencesError.message);
      else {
        setUser(data.user);
        setSaved(true);
      }
    }
    setSaving(false);
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;

    setAvatarError("");
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Choose an image smaller than 2 MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const { data: previousProfile } = await supabase
        .from("user_profiles")
        .select("avatar_path")
        .eq("user_id", user.id)
        .maybeSingle();
      const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "png";
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "0",
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) {
        if (uploadError.message.toLowerCase().includes("bucket not found")) {
          throw new Error("The profile picture storage bucket is missing. Run the avatar storage SQL migration in your Supabase project's SQL Editor, then try uploading again.");
        }
        throw uploadError;
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(
          { user_id: user.id, avatar_path: filePath, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (profileError) {
        await supabase.storage.from("avatars").remove([filePath]);
        throw profileError;
      }

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const nextAvatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;
      setAvatarUrl(nextAvatarUrl);
      setSaved(true);

      if (previousProfile?.avatar_path && previousProfile.avatar_path !== filePath) {
        await supabase.storage.from("avatars").remove([previousProfile.avatar_path]);
      }
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "We could not upload your profile picture.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePasswordUpdate() {
    setPasswordError("");
    setPasswordMessage("");
    if (password.length < 8) {
      setPasswordError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("The passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMessage("Your password has been updated.");
      setPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  async function fetchAccountData() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please sign in again before exporting your data.");
    const userId = userData.user.id;

    const [workplaces, dailyLogs, payments, goals] = await Promise.all([
      supabase.from("workplaces").select("*").eq("user_id", userId),
      supabase.from("daily_logs").select("*").eq("user_id", userId).order("log_date", { ascending: true }),
      supabase.from("payments").select("*").eq("user_id", userId).order("payment_date", { ascending: true }),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    for (const result of [workplaces, dailyLogs, payments, goals]) {
      if (result.error) throw new Error(result.error.message);
    }

    return {
      exported_at: new Date().toISOString(),
      account: {
        id: userData.user.id,
        email: userData.user.email,
        full_name: fullName,
        created_at: userData.user.created_at,
      },
      workplaces: workplaces.data ?? [],
      daily_logs: dailyLogs.data ?? [],
      payments: payments.data ?? [],
      goals: goals.data ?? [],
    };
  }

  async function exportAll() {
    setExporting(true);
    setPageError("");
    try {
      const data = await fetchAccountData();
      downloadText("earned-account-data.json", JSON.stringify(data, null, 2), "application/json");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to export your account data.");
    } finally {
      setExporting(false);
    }
  }

  async function exportDailyLogsCsv() {
    setExporting(true);
    setPageError("");
    try {
      const data = await fetchAccountData();
      const rows = [
        ["Date", "Workplace", "Classes", "Rate per class", "Income", "Notes"],
        ...data.daily_logs.map((log: any) => [
          log.log_date, log.workplace, log.classes, log.rate_per_class, log.income, log.notes,
        ]),
      ];
      downloadText(
        "earned-daily-logs.csv",
        rows.map((row) => row.map(csvCell).join(",")).join("\n"),
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to export your daily logs.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    const { error } = await supabase.functions.invoke("delete-account");

    if (error) {
      setDeleteError(error.message || "Unable to delete your account.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading your account...</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Preferences"
        title="Profile & account"
        description="Manage your personal information, preferences, security, and account data."
        action={saved ? <span className="flex items-center gap-2 text-sm font-semibold text-brand-dark dark:text-brand"><Check size={16} /> Changes saved</span> : undefined}
      />

      {pageError && (
        <Card className="mb-5 border-red-200 p-4 dark:border-red-950">
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">{pageError}</p>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><UserRound size={19} /></span>
              <div>
                <h2 className="font-bold">Personal details</h2>
                <p className="text-xs text-muted">Your profile information for this account</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-soft/50 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-brand-soft text-brand-dark shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Your profile" onError={() => setAvatarUrl("")} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={30} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Profile picture</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Google profile photos appear automatically when available. You can upload your own picture (JPG, PNG, or WebP, up to 2 MB).
                </p>
                <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-soft">
                  <Camera size={16} />
                  {avatarUploading ? "Uploading..." : avatarUrl ? "Change picture" : "Upload picture"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={avatarUploading}
                    onChange={handleAvatarUpload}
                  />
                </label>
                {avatarError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-300">{avatarError}</p>}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Full name
                <Input value={fullName} onChange={(event) => { setFullName(event.target.value); setSaved(false); }} className="mt-2" placeholder="Enter your name" />
              </label>
              <label className="text-sm font-semibold">
                Email address
                <Input value={user?.email ?? ""} className="mt-2" disabled />
                <span className="mt-1 block text-xs font-normal text-muted">{user?.email_confirmed_at ? "Email verified" : "Email verification pending"}</span>
              </label>
              <label className="text-sm font-semibold">
                Default currency
                <Select value={defaultCurrency} onChange={(event) => { setDefaultCurrency(event.target.value); setSaved(false); }} className="mt-2 w-full">
                  {currencies.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </Select>
                <span className="mt-1 block text-xs font-normal text-muted">Used as your account preference. Workplace currencies remain individually configured.</span>
              </label>
              <label className="text-sm font-semibold">
                Timezone
                <Select value={timezone} onChange={(event) => { setTimezone(event.target.value); setSaved(false); }} className="mt-2 w-full">
                  {!timezones.includes(timezone) && <option value={timezone}>{timezone}</option>}
                  {timezones.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
                </Select>
                <span className="mt-1 block text-xs font-normal text-muted">Saved as your preferred timezone for future date and reminder features.</span>
              </label>
            </div>
            <Button className="mt-5" onClick={handleSaveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Wallet size={19} /></span>
              <div>
                <h2 className="font-bold">Reminder preferences</h2>
                <p className="text-xs text-muted">Choose which reminders you would like EarnEd to support</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-4 rounded-xl border border-line bg-soft/40 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">In-app notifications</span>
                  <span className="mt-0.5 block text-xs text-muted">Show reminders in your EarnEd notification center</span>
                </span>
                <input type="checkbox" checked={reminders.in_app_enabled} onChange={(event) => { setReminders((previous) => ({ ...previous, in_app_enabled: event.target.checked })); setSaved(false); }} className="h-5 w-5 accent-[#76BE3F]" />
              </label>
              <label className="flex items-center gap-4 rounded-xl border border-line bg-soft/40 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Email notifications</span>
                  <span className="mt-0.5 block text-xs text-muted">Send selected reminders to {user?.email || "your account email"}</span>
                </span>
                <input type="checkbox" checked={reminders.email_enabled} onChange={(event) => { setReminders((previous) => ({ ...previous, email_enabled: event.target.checked })); setSaved(false); }} className="h-5 w-5 accent-[#76BE3F]" />
              </label>
            </div>
            <div className="mt-4 divide-y divide-line">
              {([
                ["payday", "Payday reminders", "A reminder before a workplace payday"],
                ["overdue", "Overdue payment alerts", "A notice when an expected payment is late"],
                ["monthly", "Monthly income summary", "A monthly recap of your recorded income"],
                ["goals", "Goal check-ins", "A periodic update on your active goals"],
              ] as const).map(([key, title, detail]) => (
                <label key={key} className="flex cursor-pointer items-center gap-4 py-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{detail}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={reminders[key]}
                    onChange={(event) => {
                      setReminders((previous) => ({ ...previous, [key]: event.target.checked }));
                      setSaved(false);
                    }}
                    className="h-5 w-5 accent-[#76BE3F]"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">Your choices are saved to your account. Email delivery will activate after the EarnEd email service is configured and verified.</p>
            <Button className="mt-4" variant="secondary" onClick={handleSaveChanges} disabled={saving}>{saving ? "Saving..." : "Save reminder preferences"}</Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"><LockKeyhole size={19} /></span>
              <div>
                <h2 className="font-bold">Password & security</h2>
                <p className="text-xs text-muted">Change the password used to sign in</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                New password
                <Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" placeholder="At least 8 characters" />
              </label>
              <label className="text-sm font-semibold">
                Confirm new password
                <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2" placeholder="Re-enter new password" />
              </label>
            </div>
            {passwordError && <p role="alert" className="mt-3 text-sm text-red-600">{passwordError}</p>}
            {passwordMessage && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{passwordMessage}</p>}
            <Button className="mt-4" variant="secondary" onClick={handlePasswordUpdate} disabled={passwordSaving || !password || !confirmPassword}>{passwordSaving ? "Updating..." : "Update password"}</Button>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CloudDownload size={20} className="text-brand" />
              <div>
                <h2 className="font-bold">Export your data</h2>
                <p className="text-xs text-muted">Download your own saved records from EarnEd</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Button variant="secondary" className="w-full justify-center" onClick={exportDailyLogsCsv} disabled={exporting}>
                <Download size={16} /> Export daily logs as CSV
              </Button>
              <Button className="w-full justify-center" onClick={exportAll} disabled={exporting}>
                <CloudDownload size={16} /> {exporting ? "Preparing export..." : "Export all account data (JSON)"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">The full export includes your profile details, workplaces, daily logs, payment records, and goals. Keep the downloaded file private.</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-brand" />
              <div>
                <h2 className="font-bold">Appearance</h2>
                <p className="text-xs text-muted">Change the theme using the moon or sun button in the top navigation.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-soft p-4 text-sm text-muted">
              Your current theme preference is managed by the app header on this device.
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-brand" />
              <div>
                <h2 className="font-bold">Account information</h2>
                <p className="text-xs text-muted">Details associated with your signed-in account</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Account created</dt><dd className="text-right font-medium">{dateTime(user?.created_at)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Email status</dt><dd className="text-right font-medium">{user?.email_confirmed_at ? "Verified" : "Not verified"}</dd></div>
            </dl>
          </Card>

          <Card className="border-red-200 p-5 sm:p-6 dark:border-red-950">
            <div className="flex items-center gap-3">
              <Trash2 size={19} className="text-red-600" />
              <div>
                <h2 className="font-bold">Delete account</h2>
                <p className="text-xs text-muted">Permanently delete your account and associated data. This cannot be undone.</p>
              </div>
            </div>
            <Button variant="danger" className="mt-5" onClick={() => setShowDeleteConfirm(true)}>Request account deletion</Button>
          </Card>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Trash2 className="text-red-600" size={24} />
              <h2 className="text-lg font-bold">Delete your account?</h2>
            </div>
            <p className="mt-4 text-sm text-muted">This is permanent. Your account and associated EarnEd records will be deleted, and you will no longer be able to access them.</p>
            <p className="mt-4 text-sm font-semibold">Type DELETE below to confirm.</p>
            <Input className="mt-2" value={deleteConfirmationText} onChange={(event) => setDeleteConfirmationText(event.target.value)} placeholder="Type DELETE" disabled={deleting} />
            {deleteError && <p role="alert" className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" disabled={deleting} onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmationText(""); setDeleteError(""); }}>Cancel</Button>
              <Button variant="danger" disabled={deleting || deleteConfirmationText !== "DELETE"} onClick={handleDeleteAccount}>{deleting ? "Deleting..." : "Permanently delete"}</Button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Private by default</span>
        <span className="flex items-center gap-1.5"><LockKeyhole size={14} /> Supabase authentication</span>
      </div>
    </>
  );
}

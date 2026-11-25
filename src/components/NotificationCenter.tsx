import { Bell, CheckCheck, Clock3, CreditCard, Goal, Info, Mail, RefreshCw, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { Button } from "./ui";

type NotificationType = "payday" | "overdue" | "monthly" | "goals" | "system";
type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

const icons = {
  payday: Wallet,
  overdue: CreditCard,
  monthly: Clock3,
  goals: Goal,
  system: Info,
};

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const navigate = useNavigate();
  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  async function loadNotifications() {
    setLoading(true);
    setError("");
    const [{ data, error: listError }, { data: preferences }] = await Promise.all([
      supabase.from("notifications").select("id,type,title,message,action_url,read_at,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("notification_preferences").select("in_app_enabled").maybeSingle(),
    ]);
    if (listError) {
      setError(listError.message);
    } else {
      setItems((data ?? []) as NotificationItem[]);
      setEnabled(preferences?.in_app_enabled ?? true);
    }
    setLoading(false);
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      channel = supabase.channel(`notifications-${data.user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${data.user.id}` }, () => {
          void loadNotifications();
        })
        .subscribe();
    });
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (open) void loadNotifications();
  }, [open]);

  async function markRead(item: NotificationItem) {
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, read_at: readAt } : entry));
    const { error: updateError } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
    if (updateError) {
      setError(updateError.message);
      void loadNotifications();
    }
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    setItems((previous) => previous.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
    const { error: updateError } = await supabase.from("notifications").update({ read_at: readAt }).is("read_at", null);
    if (updateError) {
      setError(updateError.message);
      void loadNotifications();
    }
  }

  function openNotification(item: NotificationItem) {
    void markRead(item);
    setOpen(false);
    if (item.action_url?.startsWith("/app")) navigate(item.action_url);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="relative h-11 w-11 border border-line bg-surface px-0 shadow-sm hover:bg-soft"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </Button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <section className="fixed left-3 right-3 top-20 z-50 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:max-h-[min(75vh,620px)] sm:w-[390px]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="font-bold">Notifications</h2>
                <p className="text-xs text-muted">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && <Button variant="ghost" className="h-9 px-2 text-xs" onClick={markAllRead}><CheckCheck size={15} /> Read all</Button>}
                <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={18} /></Button>
              </div>
            </div>
            {!enabled ? (
              <div className="p-6 text-center">
                <Bell size={25} className="mx-auto text-muted" />
                <p className="mt-3 text-sm font-semibold">In-app notifications are paused</p>
                <p className="mt-1 text-xs text-muted">You can turn them back on in Settings & account.</p>
                <Button className="mt-3" variant="secondary" onClick={() => { setOpen(false); navigate("/app/account"); }}>Open settings</Button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-sm text-muted"><RefreshCw size={18} className="mx-auto mb-2 animate-spin" />Loading notifications...</div>
            ) : error ? (
              <div className="p-5 text-center text-sm text-red-600 dark:text-red-300">{error}<Button className="mt-3" variant="secondary" onClick={() => void loadNotifications()}>Try again</Button></div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark"><Bell size={22} /></span>
                <p className="mt-3 text-sm font-semibold">No notifications yet</p>
                <p className="mt-1 text-xs text-muted">Payment reminders and important updates will appear here.</p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {items.map((item) => {
                  const Icon = icons[item.type] ?? Mail;
                  return (
                    <button key={item.id} onClick={() => openNotification(item)} className={`flex w-full gap-3 border-b border-line px-4 py-3.5 text-left transition hover:bg-soft ${item.read_at ? "" : "bg-brand-soft/35"}`}>
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-soft text-brand-dark dark:text-brand"><Icon size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span>{!item.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">{item.message}</span>
                        <span className="mt-2 block text-[11px] text-muted">{relativeTime(item.created_at)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-[11px] text-muted">Your notifications are private</span>
              <button className="text-xs font-semibold text-brand-dark hover:underline dark:text-brand" onClick={() => { setOpen(false); navigate("/app/account"); }}>Preferences</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

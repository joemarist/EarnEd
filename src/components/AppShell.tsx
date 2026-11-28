
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Goal,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate, NavLink, Outlet, useLocation } from "react-router";
import { Brand } from "./Brand";
import { Button } from "./ui";
import { SupportEarnEdModal } from "./SupportEarnEdModal";
import { NotificationCenter } from "./NotificationCenter";

const primaryNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/daily-log", label: "Daily Log", icon: CalendarDays },
  { to: "/app/payments", label: "Payments", icon: CircleDollarSign },
  { to: "/app/goals", label: "Goals", icon: Goal },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/workplaces", label: "Workplaces", icon: BriefcaseBusiness },
  { to: "/app/tutorials", label: "Tutorials & Tips", icon: BookOpen },
];

function HeaderGreeting({ timezone, firstName }: { timezone: string; firstName: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const formattedDate = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", timeZone: timezone });
  return <div className="hidden sm:block"><p className="text-sm font-semibold">{greeting}, {firstName}</p><p className="text-xs text-muted">{formattedDate}</p></div>;
}
function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const time = now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: timezone });
  return <div className="inline-flex h-10 w-[122px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-line bg-surface px-2 text-xs font-bold tabular-nums tracking-tight text-ink shadow-sm sm:w-[132px] sm:text-sm" aria-label={time} title={"Your time · " + timezone}>{time}</div>;
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [userFirstName, setUserFirstName] = useState("User");
  const [userAvatar, setUserAvatar] = useState("");
  const avatarRequestRef = useRef(0);
  const avatarUserIdRef = useRef<string | null>(null);

  async function loadUserAvatar(userId: string, fallback = "") {
    const requestId = ++avatarRequestRef.current;

    if (avatarUserIdRef.current !== userId) {
      avatarUserIdRef.current = userId;
      setUserAvatar("");
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("avatar_path, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    // Ignore older auth-event requests so stale responses cannot replace the latest image.
    if (requestId !== avatarRequestRef.current) return;

    if (!error && profile?.avatar_path) {
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl;
      setUserAvatar(`${publicUrl}?v=${encodeURIComponent(profile.updated_at || Date.now())}`);
      return;
    }

    // Use the Google photo only when no saved EarnEd avatar is available.
    setUserAvatar(fallback);
  }
  const [showSupport, setShowSupport] = useState(false);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const location = useLocation();
  const safeTimezone = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return timezone;
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
  })();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!hasSession) return;
    try {
      if (localStorage.getItem("earned-support-prompt-seen") === "1") return;
    } catch {
      // The persistent Support button remains available if storage is restricted.
    }
    const timer = window.setTimeout(() => {
      setShowSupport(true);
      try {
        localStorage.setItem("earned-support-prompt-seen", "1");
      } catch {
        // Do not block app access when browser storage is unavailable.
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [hasSession]);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);

      const fullName =
        data.session?.user.user_metadata?.full_name ||
        data.session?.user.user_metadata?.name ||
        "";

      setUserFirstName(fullName.split(" ")[0] || "User");
      if (data.session?.user.id) {
        void loadUserAvatar(
          data.session.user.id,
          data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture || "",
        );
      } else {
        avatarRequestRef.current += 1;
        avatarUserIdRef.current = null;
        setUserAvatar("");
      }
      setTimezone(data.session?.user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      setSessionChecked(true);
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);

        const fullName =
          session?.user.user_metadata?.full_name ||
          session?.user.user_metadata?.name ||
          "";

        setUserFirstName(fullName.split(" ")[0] || "User");
        if (session?.user.id) {
          void loadUserAvatar(
            session.user.id,
            session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
          );
        } else {
          avatarRequestRef.current += 1;
          avatarUserIdRef.current = null;
          setUserAvatar("");
        }
        setTimezone(session?.user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        setSessionChecked(true);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!sessionChecked) {
    return <div className="min-h-screen bg-canvas" />;
  }
  
  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-surface p-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2 py-2">
          <Brand />
          <Button variant="ghost" className="h-11 w-11 shrink-0 px-0 lg:hidden" onClick={() => setOpen(false)}>
            <X size={21} />
          </Button>
        </div>
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
          {primaryNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand-dark text-white shadow-sm dark:bg-brand dark:text-[#14200f]" : "text-muted hover:bg-soft hover:text-ink"}`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line pt-3">
          <button type="button" onClick={() => setShowSupport(true)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-brand">
            <HeartHandshake size={18} /> Support EarnEd (optional)
          </button>
          <NavLink
            to="/app/account"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? "bg-brand-dark text-white dark:bg-brand dark:text-[#14200f]" : "text-muted hover:bg-soft"}`
            }
          >
            <Settings size={18} /> Settings & account
          </NavLink>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-soft"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="h-12 w-12 shrink-0 px-0 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </Button>
            <HeaderGreeting timezone={safeTimezone} firstName={userFirstName} />
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <LiveClock timezone={safeTimezone} />
            <NotificationCenter />
            <NavLink
              to="/app/account"
              aria-label="Open profile and account settings"
              className="ml-0.5 flex items-center gap-2 rounded-xl p-1 hover:bg-soft sm:ml-1 sm:p-1.5"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-brand-soft text-brand-dark">
                {userAvatar ? (
                  <img src={userAvatar} alt="" onError={() => setUserAvatar("")} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={18} />
                )}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">{userFirstName}</span>
            </NavLink>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8">{<Outlet />}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-1 py-1.5 backdrop-blur lg:hidden">
        {primaryNav.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold ${isActive ? "text-brand-dark dark:text-brand" : "text-muted"}`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted"
        >
          <Menu size={22} />
          More
        </button>
      </nav>
      {showSupport && <SupportEarnEdModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}

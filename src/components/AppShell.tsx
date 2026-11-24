
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Goal,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate, NavLink, Outlet, useLocation } from "react-router";
import { Brand } from "./Brand";
import { Button } from "./ui";

const primaryNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/daily-log", label: "Daily Log", icon: CalendarDays },
  { to: "/app/payments", label: "Payments", icon: CircleDollarSign },
  { to: "/app/goals", label: "Goals", icon: Goal },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/workplaces", label: "Workplaces", icon: BriefcaseBusiness },
  { to: "/app/tutorials", label: "Tutorials & Tips", icon: BookOpen },
];

function ThemeButton() {
  const [dark, setDark] = useState(() => localStorage.getItem("earned-theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("earned-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <Button
      variant="ghost"
      className="h-10 w-10 px-0"
      onClick={() => setDark(!dark)}
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [userFirstName, setUserFirstName] = useState("User");
  const location = useLocation();
  const currentDate = new Date();
  const currentHour = currentDate.getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  const formattedDate = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  
  
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);

      const fullName =
        data.session?.user.user_metadata?.full_name ||
        data.session?.user.user_metadata?.name ||
        "";

      setUserFirstName(fullName.split(" ")[0] || "User");
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
          <Button variant="ghost" className="h-9 w-9 px-0 lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </Button>
        </div>
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
          {primaryNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-soft hover:text-ink"}`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line pt-3">
          <NavLink
            to="/app/account"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? "bg-brand text-white" : "text-muted hover:bg-soft"}`
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
              className="h-10 w-10 px-0 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">
                {greeting}, {userFirstName}
              </p>
              <p className="text-xs text-muted">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeButton />
            <NavLink
              to="/app/account"
              className="ml-1 flex items-center gap-2 rounded-xl p-1.5 hover:bg-soft"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                <UserRound size={17} />
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
              `flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold ${isActive ? "text-brand-dark dark:text-brand" : "text-muted"}`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-muted"
        >
          <Menu size={19} />
          More
        </button>
      </nav>
    </div>
  );
}

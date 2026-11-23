import { createBrowserRouter } from "react-router";
import { AppShell } from "../components/AppShell";
import { AccountPage } from "../pages/AccountPage";
import { DailyLogPage } from "../pages/DailyLogPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GoalsPage } from "../pages/GoalsPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { PaymentsPage } from "../pages/PaymentsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { TutorialsPage } from "../pages/TutorialsPage";
import { WorkplacesPage } from "../pages/WorkplacesPage";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  {
    path: "/app",
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: "daily-log", Component: DailyLogPage },
      { path: "payments", Component: PaymentsPage },
      { path: "goals", Component: GoalsPage },
      { path: "reports", Component: ReportsPage },
      { path: "workplaces", Component: WorkplacesPage },
      { path: "tutorials", Component: TutorialsPage },
      { path: "account", Component: AccountPage },
    ],
  },
  { path: "*", Component: LandingPage },
]);

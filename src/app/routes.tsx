import { createBrowserRouter } from "react-router";
import { AppShell } from "../components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => {
      const { LandingPage } = await import("../pages/LandingPage");
      return { Component: LandingPage };
    },
  },
  {
    path: "/login",
    lazy: async () => {
      const { LoginPage } = await import("../pages/LoginPage");
      return { Component: LoginPage };
    },
  },
  {
    path: "/app",
    Component: AppShell,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import("../pages/DashboardPage");
          return { Component: DashboardPage };
        },
      },
      {
        path: "daily-log",
        lazy: async () => {
          const { DailyLogPage } = await import("../pages/DailyLogPage");
          return { Component: DailyLogPage };
        },
      },
      {
        path: "payments",
        lazy: async () => {
          const { PaymentsPage } = await import("../pages/PaymentsPage");
          return { Component: PaymentsPage };
        },
      },
      {
        path: "goals",
        lazy: async () => {
          const { GoalsPage } = await import("../pages/GoalsPage");
          return { Component: GoalsPage };
        },
      },
      {
        path: "reports",
        lazy: async () => {
          const { ReportsPage } = await import("../pages/ReportsPage");
          return { Component: ReportsPage };
        },
      },
      {
        path: "workplaces",
        lazy: async () => {
          const { WorkplacesPage } = await import("../pages/WorkplacesPage");
          return { Component: WorkplacesPage };
        },
      },
      {
        path: "tutorials",
        lazy: async () => {
          const { TutorialsPage } = await import("../pages/TutorialsPage");
          return { Component: TutorialsPage };
        },
      },
      {
        path: "account",
        lazy: async () => {
          const { AccountPage } = await import("../pages/AccountPage");
          return { Component: AccountPage };
        },
      },
    ],
  },
  { path: "*", redirectTo: "/" },
]);

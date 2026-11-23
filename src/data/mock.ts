export type PayStatus = "Paid" | "Partial" | "Unpaid" | "Upcoming";

export type Workplace = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  currency: string;
  rate: number;
  rateEffective: string;
  schedule: string;
  payday: string;
  archived?: boolean;
};

export const workplaces: Workplace[] = [
  {
    id: "lingostar",
    name: "LingoStar Academy",
    shortName: "LS",
    color: "#76BE3F",
    currency: "USD",
    rate: 12.5,
    rateEffective: "Jan 1, 2025",
    schedule: "Bi-weekly",
    payday: "May 16",
  },
  {
    id: "bright",
    name: "Bright English",
    shortName: "BE",
    color: "#2F7D6D",
    currency: "USD",
    rate: 15,
    rateEffective: "Mar 1, 2025",
    schedule: "Semi-monthly",
    payday: "May 20",
  },
  {
    id: "tutorloop",
    name: "TutorLoop",
    shortName: "TL",
    color: "#E4A853",
    currency: "USD",
    rate: 10,
    rateEffective: "Nov 15, 2024",
    schedule: "Monthly",
    payday: "May 30",
  },
];

export const periods: {
  workplace: string;
  period: string;
  expected: number;
  received: number;
  receivedDate: string;
  balance: number;
  status: PayStatus;
}[] = [
  {
    workplace: "LingoStar Academy",
    period: "Apr 16 – Apr 30",
    expected: 612.5,
    received: 612.5,
    receivedDate: "May 10",
    balance: 0,
    status: "Paid",
  },
  {
    workplace: "Bright English",
    period: "Apr 16 – Apr 30",
    expected: 480,
    received: 400,
    receivedDate: "May 8",
    balance: 80,
    status: "Partial",
  },
  {
    workplace: "TutorLoop",
    period: "April 2025",
    expected: 390,
    received: 0,
    receivedDate: "—",
    balance: 390,
    status: "Unpaid",
  },
  {
    workplace: "LingoStar Academy",
    period: "May 1 – May 15",
    expected: 537.5,
    received: 0,
    receivedDate: "—",
    balance: 537.5,
    status: "Upcoming",
  },
];

export const incomeByWorkplace = [
  { name: "LingoStar", value: 1275, fill: "#76BE3F" },
  { name: "Bright English", value: 945, fill: "#2F7D6D" },
  { name: "TutorLoop", value: 430, fill: "#E4A853" },
];

export const monthlyIncome = [
  { month: "Dec", earned: 1480, received: 1400 },
  { month: "Jan", earned: 1720, received: 1640 },
  { month: "Feb", earned: 1960, received: 1800 },
  { month: "Mar", earned: 2140, received: 2100 },
  { month: "Apr", earned: 2350, received: 2010 },
  { month: "May", earned: 2650, received: 2180 },
];

export const dailyLogs = [
  {
    date: "2025-05-12",
    day: "Mon",
    number: 12,
    workplace: "LingoStar Academy",
    classes: 5,
    rate: 12.5,
    total: 62.5,
    remark: "",
  },
  {
    date: "2025-05-13",
    day: "Tue",
    number: 13,
    workplace: "Bright English",
    classes: 4,
    rate: 15,
    total: 60,
    remark: "",
  },
  {
    date: "2025-05-14",
    day: "Wed",
    number: 14,
    workplace: "LingoStar Academy",
    classes: 6,
    rate: 12.5,
    total: 75,
    remark: "Trial class",
  },
  {
    date: "2025-05-15",
    day: "Thu",
    number: 15,
    workplace: "TutorLoop",
    classes: 3,
    rate: 10,
    total: 30,
    remark: "",
  },
  {
    date: "2025-05-16",
    day: "Fri",
    number: 16,
    workplace: "—",
    classes: 0,
    rate: 0,
    total: 0,
    remark: "Day off",
  },
];

export const tutorialArticles = [
  {
    category: "Getting started",
    title: "Your first 30 days as an online ESL tutor",
    summary: "A practical roadmap from choosing a niche to teaching your first paid class.",
    time: "8 min",
    icon: "rocket",
  },
  {
    category: "Requirements",
    title: "Equipment and qualifications checklist",
    summary: "The certifications, internet setup, audio and teaching space most platforms expect.",
    time: "5 min",
    icon: "check",
  },
  {
    category: "Platforms",
    title: "Comparing tutoring platforms and companies",
    summary: "Understand contracts, booking models, cancellation policies and payment cycles.",
    time: "10 min",
    icon: "building",
  },
  {
    category: "Rates",
    title: "How to set a sustainable teaching rate",
    summary: "Price your preparation time, experience and no-show risk into a confident rate.",
    time: "7 min",
    icon: "chart",
  },
  {
    category: "Demo class",
    title: "A simple 15-minute demo class plan",
    summary: "A reusable opening, activity, correction and wrap-up flow that feels natural.",
    time: "6 min",
    icon: "video",
  },
  {
    category: "Money basics",
    title: "Payment and tax basics checklist",
    summary: "Track invoices, payment fees, exchange rates and records for tax season.",
    time: "9 min",
    icon: "wallet",
  },
];

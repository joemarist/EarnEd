import { ArrowLeft, BarChart3, CalendarCheck2, Check, KeyRound, Mail, ShieldCheck, WalletCards } from "lucide-react";
import { supabase } from "../lib/supabase";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Brand } from "../components/Brand";
import { Button, Input } from "../components/ui";

const emailSchema = z.object({ email: z.email("Enter a valid email address.") });
const passwordSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type AuthMode = "password" | "signup" | "forgot" | "verify" | "reset";

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>(
    new URLSearchParams(window.location.search).get("mode") === "reset" ? "reset" : "password",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function signInWithGoogle() {
    setError("");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Unable to connect to Google right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setIsLoading(true);

    try {
      if (mode === "forgot") {
        const parsed = emailSchema.safeParse({ email });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        });
        if (error) setError(error.message);
        else setNotice("If an account exists for that email, a password reset link is on its way. Check your inbox.");
        return;
      }

      if (mode === "reset") {
        const parsed = z.string().min(8, "Use at least 8 characters.").safeParse(password);
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: parsed.data });
        if (error) setError(error.message);
        else {
          setNotice("Your password has been updated. You can now sign in with your new password.");
          setMode("password");
          window.history.replaceState({}, "", "/login");
        }
        return;
      }

      const parsed = passwordSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) navigate("/app");
        else setMode("verify");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      navigate("/app");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isPasswordEntry = mode === "password" || mode === "signup" || mode === "reset";

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[.92fr_1.08fr]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Brand />
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {mode === "verify" ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark"><Mail size={25} /></div>
              <h1 className="mt-6 font-display text-3xl font-bold">Check your inbox</h1>
              <p className="mt-3 text-sm leading-6 text-muted">Your sign-up request was received. Open the confirmation email from EarnEd to verify your address, then come back to sign in.</p>
              <Button className="mt-7 w-full" onClick={() => { setError(""); setMode("password"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="text-sm font-bold text-brand">{mode === "signup" ? "A clearer way to manage teaching income" : mode === "forgot" ? "Account recovery" : mode === "reset" ? "Choose a new password" : "Welcome back"}</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {mode === "signup" ? "Create your EarnEd account" : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Set a new password" : "Sign in to EarnEd"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {mode === "signup" ? "Start with your first workplace and keep your classes, earnings, and paydays organized in one place." : mode === "forgot" ? "Enter the email address linked to your account and we’ll send a secure reset link." : mode === "reset" ? "Choose a strong password for your EarnEd account." : "Pick up where you left off and keep your teaching records up to date."}
                </p>
              </div>

              {mode === "password" && (
                <>
                  <Button variant="secondary" className="w-full" onClick={signInWithGoogle} disabled={isLoading}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">G</span>
                    Continue with Google
                  </Button>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or continue with email<span className="h-px flex-1 bg-line" /></div>
                </>
              )}

              <form onSubmit={submit} className={mode === "password" ? "" : "mt-2"}>
                {mode !== "reset" && (
                  <>
                    <label htmlFor="auth-email" className="text-sm font-semibold">Email address</label>
                    <Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="mt-2" required onChange={() => { setError(""); setNotice(""); }} />
                  </>
                )}
                {isPasswordEntry && (
                  <div className={mode === "reset" ? "" : "mt-5"}>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="auth-password" className="text-sm font-semibold">{mode === "reset" ? "New password" : "Password"}</label>
                      {mode === "password" && <button type="button" className="text-xs font-semibold text-brand-dark hover:underline dark:text-brand" onClick={() => { setError(""); setNotice(""); setMode("forgot"); }}>Forgot password?</button>}
                    </div>
                    <Input id="auth-password" name="password" type="password" autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"} placeholder="At least 8 characters" className="mt-2" minLength={8} required onChange={() => { setError(""); setNotice(""); }} />
                  </div>
                )}
                {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
                {notice && <p role="status" className="mt-4 rounded-xl border border-brand/20 bg-brand-soft px-3 py-2.5 text-sm text-brand-dark">{notice}</p>}
                <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
                  {isLoading ? "Please wait..." : mode === "signup" ? "Create free account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : <><KeyRound size={17} /> Sign in securely</>}
                </Button>
              </form>

              {mode === "password" ? (
                <p className="mt-8 text-center text-sm text-muted">New to EarnEd?{" "}<button type="button" className="font-bold text-ink hover:text-brand-dark" onClick={() => { setError(""); setNotice(""); setMode("signup"); }}>Create a free account</button></p>
              ) : (
                <button type="button" className="mt-6 text-sm font-semibold text-muted hover:text-ink" onClick={() => { setError(""); setNotice(""); setMode("password"); window.history.replaceState({}, "", "/login"); }}>Back to sign in</button>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted">Your account and records are protected by Supabase authentication and row-level security.</p>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-deep px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full border-[80px] border-brand/15" />
        <div className="relative flex items-center gap-2 text-sm font-semibold text-white/65"><ShieldCheck size={17} className="text-brand" /> Built around your real teaching records</div>
        <div className="relative mx-auto w-full max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-brand">Less spreadsheet stress</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight xl:text-5xl">Know what you taught, what you earned, and what has been paid.</h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/65">EarnEd brings your workplaces, daily class logs, payment records, goals, and reports together—so you can spend less time reconciling notes and more time teaching.</p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {[
              [CalendarCheck2, "Log your classes", "Keep dates, class counts, rates, and notes organized."],
              [WalletCards, "Track every payday", "Compare expected earnings with actual payments."],
              [BarChart3, "Understand your income", "Review trends and export useful reports."],
              [Check, "Set goals with purpose", "Track progress using income from your teaching logs."],
            ].map(([Icon, title, description]) => (
              <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Icon size={19} className="text-brand" />
                <h3 className="mt-3 text-sm font-bold">{String(title)}</h3>
                <p className="mt-1 text-xs leading-5 text-white/55">{String(description)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/50">
          <span>PHP-friendly for Filipino tutors</span>
          <span>Supports multiple currencies worldwide</span>
        </div>
      </aside>
    </div>
  );
}

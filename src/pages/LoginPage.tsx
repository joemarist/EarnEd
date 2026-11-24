import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Brand } from "../components/Brand";
import { Button, Input } from "../components/ui";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function LoginPage() {
  const [mode, setMode] = useState<
  "password" | "signup" | "magic" | "forgot" | "verify"
>("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function signInWithGoogle() {
    setError("");
    setIsLoading(true);
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
  
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
  
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = loginSchema.safeParse(data);
  
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
  
    setIsLoading(true);
  
    try {
      if (mode === "signup") {
        const { data: signupData, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
        });
  
        if (error) {
          setError(error.message);
          return;
        }
  
        if (signupData.session) {
          navigate("/app");
        } else {
          setMode("verify");
        }
  
        return;
      }
  
      if (mode !== "password") {
        setError("This feature isn't available yet.");
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

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[.9fr_1.1fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {mode === "verify" ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                <Mail size={25} />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold">Check your inbox</h1>
              <p className="mt-3 text-sm leading-6 text-muted">
              Your account request was received. Check your inbox for a confirmation email from Supabase before signing in.
              </p>
              <Button
                className="mt-7 w-full"
                onClick={() => setMode("password")}
              >
                Back to sign in
              </Button>
              <Button variant="ghost" className="mt-2" onClick={() => setMode("password")}>
                Use another method
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-brand">
                {mode === "signup"
                  ? "Get started"
                  : mode === "forgot"
                    ? "Account recovery"
                    : "Welcome back"}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {mode === "signup"
              ? "Create your EarnEd account"
              : mode === "forgot"
                ? "Reset your password"
                : "Sign in to EarnEd"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
              {mode === "signup"
              ? "Start tracking your teaching income with EarnEd."
              : mode === "forgot"
                ? "We’ll email you a secure link to choose a new password."
                : "Your teaching income is waiting for you."}
              </p>

              {mode === "password" && (
                <>
                  <Button
                    variant="secondary"
                    className="mt-8 w-full"
                    onClick={signInWithGoogle}
                    disabled={isLoading}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                      G
                    </span>{" "}
                    {isLoading ? "Connecting to Google..." : "Continue with Google"}
                  </Button>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-line" />
                    or continue with email
                    <span className="h-px flex-1 bg-line" />
                  </div>
                </>
              )}

              <form onSubmit={submit} className={mode === "password" ? "" : "mt-8"}>
                <label className="text-sm font-semibold">Email address</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2"
                  onChange={() => setError("")}
                />
                {(mode === "password" || mode === "signup") && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">Password</label>
                      <button
                        type="button"
                        disabled
                        className="text-xs font-semibold text-brand-dark dark:text-brand"
                        onClick={() => setMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="mt-2"
                      onChange={() => setError("")}
                    />
                  </div>
                )}
                {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
                <Button
                  type="submit"
                  className="mt-6 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    mode === "signup" ? "Creating account..." : "Signing in..."
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : mode === "password" ? (
                    <>
                      <KeyRound size={17} /> Sign in securely
                    </>
                  ) : (
                    <>
                      <Mail size={17} /> Send secure link
                    </>
                  )}
                </Button>
              </form>
              {mode === "password" ? (
                <button
                  disabled
                  className="mt-4 text-sm font-semibold text-brand-dark dark:text-brand"
                  onClick={() => setMode("magic")}
                >
                  Email me a magic link instead
                </button>
              ) : (
                <button
                  className="mt-4 text-sm font-semibold text-muted"
                  onClick={() => setMode("password")}
                >
                  Back to sign in
                </button>
              )}
              <p className="mt-8 text-center text-xs leading-5 text-muted">
                New to EarnEd?{" "}
                <button
                  type="button"
                  className="font-bold text-ink"
                  onClick={() => {
                    setError("");
                    setMode("signup");
                  }}
                >
                  Create a free account
                </button>
              </p>
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted">
          Protected with secure sessions and encrypted connections.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full border-[80px] border-brand/15" />
        <div className="relative ml-auto flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck size={17} className="text-brand" /> Privacy-first by design
        </div>
        <div className="relative max-w-xl">
          <p className="font-display text-4xl font-bold leading-tight">
            “For the first time, I know exactly what every school owes me.”
          </p>
          <p className="mt-5 text-sm text-white/60">Mia, online ESL tutor · 3 workplaces</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["$2,650", "earned this month"],
              ["146", "classes logged"],
              ["3 min", "weekly admin"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xl font-bold text-brand">{value}</p>
                <p className="mt-1 text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex gap-3 text-xs text-white/50">
          <CheckCircle2 size={16} className="text-brand" /> Mock-data preview — no account will be
          created
        </div>
      </div>
    </div>
  );
}

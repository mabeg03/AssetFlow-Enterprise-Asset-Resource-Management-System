import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AssetFlow" },
      { name: "description", content: "Sign in or create your AssetFlow account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account created");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            throw new Error("Incorrect email or password.");
          }
          throw error;
        }
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">AssetFlow</div>
            <div className="text-xs text-muted-foreground">Enterprise Asset Management</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                mode === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "signin" && (
            <div className="mt-3 text-center text-xs">
              <Link
                to="/auth/forgot-password"
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {mode === "signup" && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              The first person to sign up becomes the workspace Admin. Everyone else joins as
              Employee.
            </p>
          )}
        </div>
      </div>

      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--input, 214 32% 91%)); background: transparent; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
      .input:focus { border-color: hsl(var(--ring, 221 83% 53%)); box-shadow: 0 0 0 2px hsl(var(--ring, 221 83% 53%) / 0.2); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

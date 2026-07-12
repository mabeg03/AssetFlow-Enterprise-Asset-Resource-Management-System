"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { fetchJson } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@assetflow.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        json: { email, password },
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-serif text-3xl font-semibold text-slate-950">AssetFlow</p>
              <p className="text-sm text-slate-500">Enterprise asset operations</p>
            </div>
          </div>

          <Card className="p-7">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage allocation conflicts, audit trails, bookings, and maintenance workflows
              from a single control room.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              New employee?{" "}
              <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-900">
                Create an account
              </Link>
            </p>
          </Card>

          <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
            <p className="font-semibold">Demo access</p>
            <p className="mt-1 leading-6">
              admin@assetflow.com / manager@assetflow.com / head@assetflow.com /
              priya@assetflow.com
            </p>
            <p>Password: password123</p>
          </div>
        </div>
      </section>

      <section className="hidden bg-[var(--sidebar)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-teal-200">
            Hackathon ERP Suite
          </p>
          <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight">
            Control every asset movement with operational clarity.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            AssetFlow brings procurement records, custodianship, shared resource bookings,
            audit cycles, and repairs into a professional workflow your ops team can trust.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Lifecycle ledger", "Conflict checks", "Audit-ready"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

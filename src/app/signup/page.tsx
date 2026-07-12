"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@/components/ui";
import { fetchJson, unwrapList } from "@/lib/api-client";

type Department = {
  id: string;
  name: string;
  code?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJson("/api/departments")
      .then((payload) => setDepartments(unwrapList<Department>(payload, ["departments"])))
      .catch(() => setDepartments([]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetchJson("/api/auth/signup", {
        method: "POST",
        json: {
          ...form,
          departmentId: form.departmentId || undefined,
          role: "EMPLOYEE",
        },
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
          Employee onboarding
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-950">
          Create your AssetFlow account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Self signup creates an employee account. Admins assign elevated roles such as Asset
          Manager or Department Head after verification.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Full name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Work email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Department</span>
            <Select
              value={form.departmentId}
              onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
            >
              <option value="">Select after joining</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} {department.code ? `(${department.code})` : ""}
                </option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
            <Input
              type="password"
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create employee account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already onboarded?{" "}
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}

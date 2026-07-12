"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { fetchJson } from "@/lib/api-client";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
};

type MeResponse = {
  user?: User;
} & Partial<User>;

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchJson<MeResponse>("/api/auth/me")
      .then((payload) => {
        if (!active) return;
        const nextUser = payload.user || (payload.id ? (payload as User) : null);
        if (!nextUser) {
          router.replace("/login");
          return;
        }
        if (pathname.startsWith("/organization") && nextUser.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setUser(nextUser);
      })
      .catch(() => router.replace("/login"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Checking your AssetFlow session...</p>
        </div>
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}

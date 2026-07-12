import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "asset_manager" | "department_head" | "employee";

export type Employee = {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
};

type AuthCtx = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  employee: Employee | null;
  role: Role | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const [{ data: emp }, { data: roleRow }] = await Promise.all([
      supabase.from("employees").select("id, name, email, department_id").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).order("role").limit(1).maybeSingle(),
    ]);
    setEmployee((emp as Employee) ?? null);
    setRole(((roleRow as { role: Role } | null)?.role) ?? null);
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) await loadProfile(data.session.user.id);
    else {
      setEmployee(null);
      setRole(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    // Subscribe first
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user) {
        // Defer to avoid deadlock with auth callback
        setTimeout(() => {
          if (mounted) void loadProfile(sess.user.id);
        }, 0);
      } else {
        setEmployee(null);
        setRole(null);
      }
    });
    // Then fetch initial session
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    })();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    loading,
    session,
    user: session?.user ?? null,
    employee,
    role,
    refresh,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  asset_manager: "Asset Manager",
  department_head: "Department Head",
  employee: "Employee",
};

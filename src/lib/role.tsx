import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "admin" | "manager" | "employee";

type RoleCtx = {
  role: Role;
  setRole: (r: Role) => void;
  userName: string;
};

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  const userName =
    role === "admin" ? "Alex Chen" : role === "manager" ? "Priya Shah" : "Jordan Reyes";
  return <Ctx.Provider value={{ role, setRole, userName }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole outside RoleProvider");
  return v;
}

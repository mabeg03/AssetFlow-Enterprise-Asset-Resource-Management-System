import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Tags, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/organization")({
  head: () => ({ meta: [{ title: "Organization — AssetFlow" }] }),
  component: OrgPage,
});

const ROLES: Role[] = ["admin", "asset_manager", "department_head", "employee"];

function OrgPage() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div>
      <PageHeader
        title="Organization Setup"
        subtitle="Departments, categories and employee directory"
      />
      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <DepartmentsCard />
        <CategoriesCard />
        <div className="lg:col-span-2">
          <EmployeesCard currentUserId={user?.id ?? null} />
        </div>
      </div>
    </div>
  );
}

function DepartmentsCard() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const q = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("departments").insert({ name: name.trim() });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["departments"] });
  }

  return (
    <SectionCard title="Departments" description="Organizational units">
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New department"
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </form>
      {q.isLoading ? (
        <Loader />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No departments"
          description="Add your first department above."
        />
      ) : (
        <ul className="divide-y divide-border">
          {q.data!.map((d) => (
            <li key={d.id} className="py-2 text-sm">
              {d.name}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function CategoriesCard() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const q = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("asset_categories").insert({ name: name.trim() });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <SectionCard title="Asset Categories" description="Group assets by type">
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category"
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </form>
      {q.isLoading ? (
        <Loader />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Tags className="h-5 w-5" />}
          title="No categories"
          description="Add your first category above."
        />
      ) : (
        <ul className="divide-y divide-border">
          {q.data!.map((c) => (
            <li key={c.id} className="py-2 text-sm">
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function EmployeesCard({ currentUserId }: { currentUserId: string | null }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["employees-directory"],
    queryFn: async () => {
      const [{ data: emps, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("employees").select("id, name, email").order("name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const rmap = new Map<string, Role>();
      (roles ?? []).forEach((r) => rmap.set(r.user_id, r.role as Role));
      return (emps ?? []).map((e) => ({ ...e, role: rmap.get(e.id) ?? "employee" }));
    },
  });

  async function changeRole(userId: string, newRole: Role) {
    // Delete existing roles, insert new one
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["employees-directory"] });
  }

  return (
    <SectionCard title="Employee Directory" description="Assign roles to team members">
      {q.isLoading ? (
        <Loader />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No employees yet"
          description="People will appear here as they sign up."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data!.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-medium">{e.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={e.role}
                      disabled={e.id === currentUserId}
                      onChange={(ev) => changeRole(e.id, ev.target.value as Role)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-60"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    {e.id === currentUserId && (
                      <span className="ml-2 text-[11px] text-muted-foreground">(you)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function Loader() {
  return (
    <div className="grid place-items-center py-8 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

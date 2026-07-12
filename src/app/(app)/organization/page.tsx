"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea, cn } from "@/components/ui";
import { fetchJson, labelize, unwrapList } from "@/lib/api-client";

type Department = { id: string; name: string; code: string; status?: string; headId?: string | null; head?: User | null };
type Category = { id: string; name: string; description?: string | null; customFieldsJson?: string | null };
type User = { id: string; name: string; email: string; role: string; status?: string; departmentId?: string | null };

const roles = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

export default function OrganizationPage() {
  const [tab, setTab] = useState<"Departments" | "Categories" | "Employees">("Departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [deptForm, setDeptForm] = useState({ name: "", code: "", headId: "" });
  const [catForm, setCatForm] = useState({ name: "", description: "", customFieldsJson: "" });

  async function load() {
    const [deptPayload, catPayload, userPayload] = await Promise.all([
      fetchJson("/api/departments").catch(() => []),
      fetchJson("/api/categories").catch(() => []),
      fetchJson("/api/employees").catch(() => []),
    ]);
    setDepartments(unwrapList<Department>(deptPayload, ["departments"]));
    setCategories(unwrapList<Category>(catPayload, ["categories"]));
    setEmployees(unwrapList<User>(userPayload, ["employees", "users"]));
  }

  useEffect(() => {
    load();
  }, []);

  const heads = useMemo(
    () => employees.filter((employee) => ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(employee.role)),
    [employees]
  );

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await fetchJson("/api/departments", {
      method: "POST",
      json: { ...deptForm, headId: deptForm.headId || undefined },
    });
    setDeptForm({ name: "", code: "", headId: "" });
    setMessage("Department created.");
    await load();
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await fetchJson("/api/categories", {
      method: "POST",
      json: {
        ...catForm,
        customFieldsJson: catForm.customFieldsJson || undefined,
      },
    });
    setCatForm({ name: "", description: "", customFieldsJson: "" });
    setMessage("Category created.");
    await load();
  }

  async function updateEmployee(user: User, patch: Partial<User>) {
    setMessage("");
    await fetchJson(`/api/employees/${user.id}`, {
      method: "PATCH",
      json: patch,
    });
    setMessage("Employee updated.");
    await load();
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin workspace"
        title="Organization"
        description="Maintain departments, asset categories, and user role assignments for governance workflows."
      />

      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {(["Departments", "Categories", "Employees"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold",
              tab === item ? "bg-teal-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Departments" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <h2 className="font-serif text-xl font-semibold">Create department</h2>
            <form onSubmit={createDepartment} className="mt-4 space-y-4">
              <Input placeholder="Department name" value={deptForm.name} onChange={(event) => setDeptForm({ ...deptForm, name: event.target.value })} required />
              <Input placeholder="Code, e.g. FIN" value={deptForm.code} onChange={(event) => setDeptForm({ ...deptForm, code: event.target.value.toUpperCase() })} required />
              <Select value={deptForm.headId} onChange={(event) => setDeptForm({ ...deptForm, headId: event.target.value })}>
                <option value="">Assign department head later</option>
                {heads.map((head) => <option key={head.id} value={head.id}>{head.name}</option>)}
              </Select>
              <Button type="submit">Create department</Button>
            </form>
          </Card>
          <Card>
            <h2 className="font-serif text-xl font-semibold">Departments</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {departments.length ? departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{department.name}</p>
                    <p className="text-sm text-slate-500">{department.code} · Head: {department.head?.name || "Not assigned"}</p>
                  </div>
                  <Badge tone={department.status === "INACTIVE" ? "muted" : "success"}>{department.status || "ACTIVE"}</Badge>
                </div>
              )) : <EmptyState title="No departments yet" description="Create business units before assigning custodians." />}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "Categories" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <h2 className="font-serif text-xl font-semibold">Create category</h2>
            <form onSubmit={createCategory} className="mt-4 space-y-4">
              <Input placeholder="Laptop, Vehicle, Projector" value={catForm.name} onChange={(event) => setCatForm({ ...catForm, name: event.target.value })} required />
              <Textarea placeholder="Description and handling policy" value={catForm.description} onChange={(event) => setCatForm({ ...catForm, description: event.target.value })} />
              <Textarea placeholder='Custom fields JSON, e.g. {"warrantyProvider":"text"}' value={catForm.customFieldsJson} onChange={(event) => setCatForm({ ...catForm, customFieldsJson: event.target.value })} />
              <Button type="submit">Create category</Button>
            </form>
          </Card>
          <Card>
            <h2 className="font-serif text-xl font-semibold">Asset categories</h2>
            <div className="mt-4 grid gap-3">
              {categories.length ? categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{category.description || "No description"}</p>
                </div>
              )) : <EmptyState title="No categories yet" description="Define categories to drive asset registration." />}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "Employees" ? (
        <Card>
          <h2 className="font-serif text-xl font-semibold">Employees and roles</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3">Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="py-3">
                      <p className="font-semibold text-slate-900">{employee.name}</p>
                      <p className="text-slate-500">{employee.email}</p>
                    </td>
                    <td>
                      <Select value={employee.departmentId || ""} onChange={(event) => updateEmployee(employee, { departmentId: event.target.value || null })}>
                        <option value="">Unassigned</option>
                        {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                      </Select>
                    </td>
                    <td>
                      <Select value={employee.role} onChange={(event) => updateEmployee(employee, { role: event.target.value })}>
                        {roles.map((role) => <option key={role} value={role}>{labelize(role)}</option>)}
                      </Select>
                    </td>
                    <td><Badge tone={employee.status === "INACTIVE" ? "muted" : "success"}>{employee.status || "ACTIVE"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}

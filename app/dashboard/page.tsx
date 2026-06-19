import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./logout-button";


const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  department_head: "Department Head",
  staff: "Staff",
  hr_admin: "HR Admin",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Belt-and-suspenders — proxy.ts already handles this, but a server
  // component should never trust that alone.
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Welcome, {user.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {ROLE_LABELS[user.role]} · {user.department} · {user.employeeId}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-sm text-neutral-600">
            Auth is wired up and working — login, session cookie, route
            protection, and logout all run through this page. The KPI
            dashboard and alerts feed get built into this same page next.
          </p>
        </div>
      </div>
    </main>
  );
}
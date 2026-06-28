import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { DashboardTopNav } from "@/components/layout/dashboard-top-nav";
import { SkipLink } from "@/components/shared/skip-link";
import { isAdminUser } from "@/lib/auth/admin-role";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!(await isAdminUser(userId, sessionClaims))) {
    redirect("/dashboard");
  }
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <SkipLink />
      <AdminSidebar />
      <AdminMobileNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopNav />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 pb-safe outline-none sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

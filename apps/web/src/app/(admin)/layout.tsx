import { RequireSuperAdmin } from "@/shared/components/RequireSuperAdmin";
import { AdminSidebar } from "@/features/super-admin/components/AdminSidebar";

export const metadata = {
  title: "Super Admin — Toqe",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireSuperAdmin>
      <div className="tqe-super-admin tqe-sa-shell">
        <AdminSidebar />
        <main className="tqe-sa-main">{children}</main>
      </div>
    </RequireSuperAdmin>
  );
}

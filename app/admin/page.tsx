import { redirect } from "next/navigation";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <AdminStudio />;
}

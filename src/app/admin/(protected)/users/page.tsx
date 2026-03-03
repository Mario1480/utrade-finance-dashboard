import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { UsersManager } from "@/components/UsersManager";

export default async function UsersPage() {
  const session = await getServerSession();
  if (session?.role !== "SUPERADMIN") {
    redirect("/admin/dashboard");
  }

  return <UsersManager />;
}

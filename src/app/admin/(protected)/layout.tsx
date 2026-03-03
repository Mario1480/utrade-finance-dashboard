import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="container">
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 8 }}>uTrade Admin</h2>
        <p>
          Angemeldet als <strong>{session.name}</strong> ({session.role})
        </p>
      </div>
      <AdminNav />
      {children}
    </main>
  );
}

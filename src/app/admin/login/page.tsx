import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="container">
      <LoginForm />
    </main>
  );
}

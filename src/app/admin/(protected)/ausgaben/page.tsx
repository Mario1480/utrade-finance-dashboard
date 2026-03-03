import { getServerSession } from "@/lib/session";
import { ExpenseManager } from "@/components/ExpenseManager";

export default async function AusgabenPage() {
  const session = await getServerSession();

  return <ExpenseManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

import { getServerSession } from "@/lib/session";
import { IncomeManager } from "@/components/IncomeManager";

export default async function EinnahmenPage() {
  const session = await getServerSession();

  return <IncomeManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

import { getServerSession } from "@/lib/session";
import { RulesManager } from "@/components/RulesManager";

export default async function RulesPage() {
  const session = await getServerSession();

  return <RulesManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

import { getServerSession } from "@/lib/session";
import { BurningManager } from "@/components/BurningManager";

export default async function BurningPage() {
  const session = await getServerSession();

  return <BurningManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

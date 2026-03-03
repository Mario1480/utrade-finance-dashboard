import { getServerSession } from "@/lib/session";
import { TeamManager } from "@/components/TeamManager";

export default async function TeamPage() {
  const session = await getServerSession();

  return <TeamManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

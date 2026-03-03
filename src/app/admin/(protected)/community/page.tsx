import { getServerSession } from "@/lib/session";
import { CommunityMonthStatusManager } from "@/components/CommunityMonthStatusManager";

export default async function CommunityAdminPage() {
  const session = await getServerSession();

  return (
    <CommunityMonthStatusManager isSuperadmin={session?.role === "SUPERADMIN"} />
  );
}

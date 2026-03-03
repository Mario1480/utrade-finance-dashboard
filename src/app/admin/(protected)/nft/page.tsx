import { getServerSession } from "@/lib/session";
import { NftManager } from "@/components/NftManager";

export default async function NftPage() {
  const session = await getServerSession();

  return <NftManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

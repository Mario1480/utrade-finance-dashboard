import { getServerSession } from "@/lib/session";
import { AddressManager } from "@/components/AddressManager";

export default async function AdressenPage() {
  const session = await getServerSession();

  return <AddressManager isSuperadmin={session?.role === "SUPERADMIN"} />;
}

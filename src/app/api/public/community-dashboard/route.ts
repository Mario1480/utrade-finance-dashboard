import { ok } from "@/lib/api";
import { buildCommunityDashboardData } from "@/lib/community-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await buildCommunityDashboardData();
  return ok(data);
}

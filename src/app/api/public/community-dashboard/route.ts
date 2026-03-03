import { ok } from "@/lib/api";
import { buildCommunityDashboardData } from "@/lib/community-dashboard";

export async function GET() {
  const data = await buildCommunityDashboardData();
  return ok(data);
}

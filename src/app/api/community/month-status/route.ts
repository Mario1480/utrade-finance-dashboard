import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import { getCommunityMonthStatusOverview } from "@/lib/community-dashboard";
import { handleRouteError } from "@/lib/route-utils";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const data = await getCommunityMonthStatusOverview();
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

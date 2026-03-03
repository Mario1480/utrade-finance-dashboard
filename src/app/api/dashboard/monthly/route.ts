import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import { getMonthlyDashboard } from "@/lib/calculations";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const month = request.nextUrl.searchParams.get("month");
    if (!month) {
      throw new Error("Query month fehlt");
    }

    const data = await getMonthlyDashboard(monthStringToDate(month));
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { addMonths, compareAsc } from "date-fns";
import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import { getMonthlyDashboard } from "@/lib/calculations";
import { dateToMonthString, monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    if (!from || !to) {
      throw new Error("Query from/to fehlt");
    }

    const fromDate = monthStringToDate(from);
    const toDate = monthStringToDate(to);

    if (compareAsc(fromDate, toDate) === 1) {
      throw new Error("from darf nicht nach to liegen");
    }

    const list = [] as Array<{
      month: string;
      incomeTotal: number;
      expenseTotal: number;
      profitTotal: number;
      nftProfitPool: number;
      teamPool: number;
      treasuryPool: number;
    }>;

    let cursor = fromDate;
    while (compareAsc(cursor, toDate) <= 0) {
      const monthData = await getMonthlyDashboard(cursor);
      list.push({
        month: dateToMonthString(cursor),
        incomeTotal: monthData.totals.incomeTotal,
        expenseTotal: monthData.totals.expenseTotal,
        profitTotal: monthData.totals.profitTotal,
        nftProfitPool: monthData.totals.nftProfitPool,
        teamPool: monthData.totals.teamPool,
        treasuryPool: monthData.totals.treasuryPool,
      });
      cursor = addMonths(cursor, 1);
    }

    return ok(list);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import { buildMonthOptions } from "@/lib/month-options";
import { handleRouteError } from "@/lib/route-utils";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const [incomeMonths, expenseMonths, nftMonths] = await Promise.all([
      prisma.incomeEntry.findMany({
        where: { status: "APPROVED" },
        select: { month: true },
        distinct: ["month"],
      }),
      prisma.expenseEntry.findMany({
        where: { status: "APPROVED" },
        select: { month: true },
        distinct: ["month"],
      }),
      prisma.nftMonthlySale.findMany({
        where: { status: "APPROVED" },
        select: { month: true },
        distinct: ["month"],
      }),
    ]);

    const allMonths = [...incomeMonths, ...expenseMonths, ...nftMonths].map(
      (item) => item.month,
    );
    const months = buildMonthOptions(allMonths);
    return ok({ months });
  } catch (error) {
    return handleRouteError(error);
  }
}

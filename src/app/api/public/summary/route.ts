import { ok } from "@/lib/api";
import {
  getPublishedMonthKeys,
  monthKeyToDate,
} from "@/lib/community-dashboard";
import { getMonthlyDashboard } from "@/lib/calculations";

export async function GET() {
  const entries = [] as Array<{
    month: string;
    incomeTotal: number;
    expenseTotal: number;
    profitTotal: number;
  }>;

  const months = await getPublishedMonthKeys();
  for (const month of months) {
    const data = await getMonthlyDashboard(monthKeyToDate(month));
    entries.push({
      month,
      incomeTotal: data.totals.incomeTotal,
      expenseTotal: data.totals.expenseTotal,
      profitTotal: data.totals.profitTotal,
    });
  }

  const aggregates = entries.reduce(
    (acc, item) => ({
      incomeTotal: acc.incomeTotal + item.incomeTotal,
      expenseTotal: acc.expenseTotal + item.expenseTotal,
      profitTotal: acc.profitTotal + item.profitTotal,
    }),
    { incomeTotal: 0, expenseTotal: 0, profitTotal: 0 },
  );

  return ok({
    period: {
      from: entries[entries.length - 1]?.month ?? null,
      to: entries[0]?.month ?? null,
    },
    totals: aggregates,
    monthly: entries,
  });
}

import { dateToMonthString } from "@/lib/month";

export function buildMonthOptions(months: Date[]): string[] {
  const normalized = months.map((month) => dateToMonthString(month));
  return [...new Set(normalized)].sort((a, b) => b.localeCompare(a));
}

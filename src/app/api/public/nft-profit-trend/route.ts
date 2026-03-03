import { getMonthlyDashboard } from "@/lib/calculations";
import { ok } from "@/lib/api";
import {
  getPublishedMonthKeys,
  monthKeyToDate,
} from "@/lib/community-dashboard";

export async function GET() {
  const trend = [] as Array<{
    month: string;
    nftProfitPool: number;
    bronzePerNft: number;
    silverPerNft: number;
    goldPerNft: number;
  }>;

  const months = await getPublishedMonthKeys();
  for (const month of months) {
    const data = await getMonthlyDashboard(monthKeyToDate(month));

    trend.push({
      month,
      nftProfitPool: data.totals.nftProfitPool,
      bronzePerNft: data.nftProfit.bronze.perNft,
      silverPerNft: data.nftProfit.silver.perNft,
      goldPerNft: data.nftProfit.gold.perNft,
    });
  }

  return ok(trend);
}

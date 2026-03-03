import { EntryStatus, TokenType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMonthlyDashboard } from "@/lib/calculations";
import { dateToMonthString, monthStringToDate } from "@/lib/month";
import { toNumber } from "@/lib/number";

export type CommunityMonthStatusMap = Record<string, { isClosed: boolean }>;

export type CommunityMonthlyNftPool = {
  month: string;
  nftPoolTotal: number;
  bronzeTotal: number;
  silverTotal: number;
  goldTotal: number;
  bronzePerNft: number;
  silverPerNft: number;
  goldPerNft: number;
};

export type CommunityBurningMonthly = {
  month: string;
  uttAmount: number;
  usharkAmount: number;
  txLinksUtt: string[];
  txLinksUshark: string[];
};

export type CommunityTotals = {
  profitAllMonths: number;
  nftPoolAllMonths: number;
  profitBronzeAllMonths: number;
  profitSilverAllMonths: number;
  profitGoldAllMonths: number;
  burningTotalUtt: number;
  burningTotalUshark: number;
};

export function getCurrentUtcMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function monthKeyToDate(month: string): Date {
  return monthStringToDate(month);
}

export function selectPublishedMonths(
  approvedMonths: string[],
  statusMap: CommunityMonthStatusMap,
  currentMonth: string,
): string[] {
  const uniqueSorted = [...new Set(approvedMonths)].sort((a, b) => b.localeCompare(a));

  return uniqueSorted.filter(
    (month) => month <= currentMonth && statusMap[month]?.isClosed === true,
  );
}

export function aggregateBurningRows(
  rows: Array<{
    month: Date;
    token: TokenType;
    amountToken: number;
    txUrl: string;
  }>,
): CommunityBurningMonthly[] {
  const byMonth = new Map<string, CommunityBurningMonthly>();

  for (const row of rows) {
    const month = dateToMonthString(row.month);

    const current = byMonth.get(month) ?? {
      month,
      uttAmount: 0,
      usharkAmount: 0,
      txLinksUtt: [],
      txLinksUshark: [],
    };

    if (row.token === TokenType.UTT) {
      current.uttAmount += row.amountToken;
      if (!current.txLinksUtt.includes(row.txUrl)) {
        current.txLinksUtt.push(row.txUrl);
      }
    }

    if (row.token === TokenType.USHARK) {
      current.usharkAmount += row.amountToken;
      if (!current.txLinksUshark.includes(row.txUrl)) {
        current.txLinksUshark.push(row.txUrl);
      }
    }

    byMonth.set(month, current);
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function computeCommunityTotals(
  monthlyNftPool: CommunityMonthlyNftPool[],
  burningMonthly: CommunityBurningMonthly[],
  monthlyProfitTotals: Array<{ month: string; profitTotal: number }>,
): CommunityTotals {
  const nftTotals = monthlyNftPool.reduce(
    (acc, row) => ({
      nftPoolAllMonths: acc.nftPoolAllMonths + row.nftPoolTotal,
      profitBronzeAllMonths: acc.profitBronzeAllMonths + row.bronzeTotal,
      profitSilverAllMonths: acc.profitSilverAllMonths + row.silverTotal,
      profitGoldAllMonths: acc.profitGoldAllMonths + row.goldTotal,
    }),
    {
      nftPoolAllMonths: 0,
      profitBronzeAllMonths: 0,
      profitSilverAllMonths: 0,
      profitGoldAllMonths: 0,
    },
  );

  const burningTotals = burningMonthly.reduce(
    (acc, row) => ({
      burningTotalUtt: acc.burningTotalUtt + row.uttAmount,
      burningTotalUshark: acc.burningTotalUshark + row.usharkAmount,
    }),
    {
      burningTotalUtt: 0,
      burningTotalUshark: 0,
    },
  );

  const profitAllMonths = monthlyProfitTotals.reduce(
    (sum, row) => sum + row.profitTotal,
    0,
  );

  return {
    profitAllMonths,
    nftPoolAllMonths: nftTotals.nftPoolAllMonths,
    profitBronzeAllMonths: nftTotals.profitBronzeAllMonths,
    profitSilverAllMonths: nftTotals.profitSilverAllMonths,
    profitGoldAllMonths: nftTotals.profitGoldAllMonths,
    burningTotalUtt: burningTotals.burningTotalUtt,
    burningTotalUshark: burningTotals.burningTotalUshark,
  };
}

export async function getApprovedMonthKeys(): Promise<string[]> {
  const [incomeMonths, expenseMonths, nftMonths] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { status: EntryStatus.APPROVED },
      select: { month: true },
      distinct: ["month"],
    }),
    prisma.expenseEntry.findMany({
      where: { status: EntryStatus.APPROVED },
      select: { month: true },
      distinct: ["month"],
    }),
    prisma.nftMonthlySale.findMany({
      where: { status: EntryStatus.APPROVED },
      select: { month: true },
      distinct: ["month"],
    }),
  ]);

  const keys = [...incomeMonths, ...expenseMonths, ...nftMonths].map((row) =>
    dateToMonthString(row.month),
  );

  return [...new Set(keys)].sort((a, b) => b.localeCompare(a));
}

export async function ensureCommunityMonthStatuses(): Promise<void> {
  const approvedMonths = await getApprovedMonthKeys();
  if (approvedMonths.length === 0) {
    return;
  }

  const monthDates = approvedMonths.map((month) => monthKeyToDate(month));
  const currentMonthStart = getCurrentUtcMonthStart();

  const existingRows = await prisma.communityMonthStatus.findMany({
    where: { month: { in: monthDates } },
    select: { month: true },
  });

  const existing = new Set(existingRows.map((row) => dateToMonthString(row.month)));
  const missing = approvedMonths.filter((month) => !existing.has(month));

  if (missing.length > 0) {
    await prisma.communityMonthStatus.createMany({
      data: missing.map((month) => {
        const monthDate = monthKeyToDate(month);
        const isHistorical = monthDate < currentMonthStart;

        return {
          month: monthDate,
          isClosed: isHistorical,
          closedAt: isHistorical ? new Date() : null,
          closedById: null,
        };
      }),
      skipDuplicates: true,
    });
  }
}

export async function getCommunityMonthStatusOverview() {
  await ensureCommunityMonthStatuses();
  const approvedMonths = await getApprovedMonthKeys();

  const monthDates = approvedMonths.map((month) => monthKeyToDate(month));

  const rows = monthDates.length
    ? await prisma.communityMonthStatus.findMany({
        where: { month: { in: monthDates } },
        include: {
          closedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    : [];

  const byMonth = new Map(rows.map((row) => [dateToMonthString(row.month), row]));

  return approvedMonths
    .map((month) => {
      const status = byMonth.get(month);

      return {
        month,
        hasApprovedData: true,
        isClosed: status?.isClosed ?? false,
        closedAt: status?.closedAt ?? null,
        closedBy: status?.closedBy ?? null,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function getPublishedMonthKeys(): Promise<string[]> {
  try {
    await ensureCommunityMonthStatuses();
    const approvedMonths = await getApprovedMonthKeys();

    if (approvedMonths.length === 0) {
      return [];
    }

    const statuses = await prisma.communityMonthStatus.findMany({
      where: { month: { in: approvedMonths.map((month) => monthKeyToDate(month)) } },
      select: { month: true, isClosed: true },
    });

    const statusMap: CommunityMonthStatusMap = statuses.reduce(
      (acc, row) => {
        acc[dateToMonthString(row.month)] = { isClosed: row.isClosed };
        return acc;
      },
      {} as CommunityMonthStatusMap,
    );

    const currentMonth = dateToMonthString(getCurrentUtcMonthStart());
    return selectPublishedMonths(approvedMonths, statusMap, currentMonth);
  } catch (error) {
    console.error("[community-dashboard] failed to read published months", error);
    return [];
  }
}

export async function buildCommunityDashboardData() {
  const months = await getPublishedMonthKeys();
  const includedMonths: string[] = [];

  const monthlyNftPool: CommunityMonthlyNftPool[] = [];
  const monthlyProfitTotals: Array<{ month: string; profitTotal: number }> = [];

  for (const month of months) {
    try {
      const data = await getMonthlyDashboard(monthKeyToDate(month));

      includedMonths.push(month);

      monthlyNftPool.push({
        month,
        nftPoolTotal: data.totals.nftProfitPool,
        bronzeTotal: data.nftProfit.bronze.total,
        silverTotal: data.nftProfit.silver.total,
        goldTotal: data.nftProfit.gold.total,
        bronzePerNft: data.nftProfit.bronze.perNft,
        silverPerNft: data.nftProfit.silver.perNft,
        goldPerNft: data.nftProfit.gold.perNft,
      });

      monthlyProfitTotals.push({
        month,
        profitTotal: data.totals.profitTotal,
      });
    } catch (error) {
      console.error(`[community-dashboard] skipped month ${month}`, error);
    }
  }

  const burningRows = includedMonths.length
    ? await prisma.burningEntry.findMany({
        where: {
          status: EntryStatus.APPROVED,
          month: { in: includedMonths.map((month) => monthKeyToDate(month)) },
        },
        select: { month: true, token: true, amountToken: true, txUrl: true },
      })
    : [];

  const burningMonthly = aggregateBurningRows(
    burningRows.map((row) => ({
      month: row.month,
      token: row.token,
      amountToken: toNumber(row.amountToken),
      txUrl: row.txUrl,
    })),
  );

  const totals = computeCommunityTotals(monthlyNftPool, burningMonthly, monthlyProfitTotals);

  return {
    months: includedMonths,
    monthlyNftPool,
    burningMonthly,
    totals,
  };
}

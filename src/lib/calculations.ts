import type {
  AllocationRule,
  NftSaleSplitRule,
  NftTierRule,
  TeamMember,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { dateToMonthString } from "@/lib/month";
import { round2, toNumber } from "@/lib/number";

export type TierCounts = {
  bronze: number;
  silver: number;
  gold: number;
};

export type DashboardComputationInput = {
  month: Date;
  incomeTotal: number;
  expenseTotal: number;
  tierCounts: TierCounts;
  allocationRule: AllocationRule;
  tierRule: NftTierRule;
  saleSplitRule: NftSaleSplitRule;
  teamMembers: TeamMember[];
  nftSalesByTier: {
    bronzeUsd: number;
    silverUsd: number;
    goldUsd: number;
    totalUsd: number;
  };
};

export function computeMonthlyKpis(input: DashboardComputationInput) {
  const profitTotal = input.incomeTotal - input.expenseTotal;

  const nftPoolPct = toNumber(input.allocationRule.nftPoolPct);
  const buybackUttPct = toNumber(input.allocationRule.buybackUttPct);
  const buybackUsharkPct = toNumber(input.allocationRule.buybackUsharkPct);
  const teamPct = toNumber(input.allocationRule.teamPct);
  const treasuryPct = toNumber(input.allocationRule.treasuryPct);

  const nftProfitPool = profitTotal * nftPoolPct;
  const buybackUtt = profitTotal * buybackUttPct;
  const buybackUshark = profitTotal * buybackUsharkPct;
  const teamPool = profitTotal * teamPct;
  const treasuryPool = profitTotal * treasuryPct;

  const bronzeMultiplier = toNumber(input.tierRule.bronzeMultiplier);
  const silverMultiplier = toNumber(input.tierRule.silverMultiplier);
  const goldMultiplier = toNumber(input.tierRule.goldMultiplier);

  const totalShares =
    input.tierCounts.bronze * bronzeMultiplier +
    input.tierCounts.silver * silverMultiplier +
    input.tierCounts.gold * goldMultiplier;

  const profitPerShare = totalShares > 0 ? nftProfitPool / totalShares : 0;

  const nftProfit = {
    totalShares,
    profitPerShare: round2(profitPerShare),
    bronze: {
      count: input.tierCounts.bronze,
      multiplier: bronzeMultiplier,
      perNft: round2(profitPerShare * bronzeMultiplier),
      total: round2(input.tierCounts.bronze * profitPerShare * bronzeMultiplier),
    },
    silver: {
      count: input.tierCounts.silver,
      multiplier: silverMultiplier,
      perNft: round2(profitPerShare * silverMultiplier),
      total: round2(input.tierCounts.silver * profitPerShare * silverMultiplier),
    },
    gold: {
      count: input.tierCounts.gold,
      multiplier: goldMultiplier,
      perNft: round2(profitPerShare * goldMultiplier),
      total: round2(input.tierCounts.gold * profitPerShare * goldMultiplier),
    },
  };

  const teamPayouts = input.teamMembers
    .filter((member) => member.isActive)
    .map((member) => ({
      name: member.name,
      payoutPct: toNumber(member.payoutPct),
      payoutUsd: round2(teamPool * toNumber(member.payoutPct)),
      walletChain: member.walletChain,
      walletAddress: member.walletAddress,
    }));

  const splitTradingPct = toNumber(input.saleSplitRule.tradingPct);
  const splitInfrastructurePct = toNumber(input.saleSplitRule.infrastructurePct);
  const splitOperationsPct = toNumber(input.saleSplitRule.operationsPct);

  const salesSplit = {
    totalUsd: round2(input.nftSalesByTier.totalUsd),
    tradingUsd: round2(input.nftSalesByTier.totalUsd * splitTradingPct),
    infrastructureUsd: round2(input.nftSalesByTier.totalUsd * splitInfrastructurePct),
    operationsUsd: round2(input.nftSalesByTier.totalUsd * splitOperationsPct),
    pct: {
      trading: splitTradingPct,
      infrastructure: splitInfrastructurePct,
      operations: splitOperationsPct,
    },
  };

  return {
    month: dateToMonthString(input.month),
    totals: {
      incomeTotal: round2(input.incomeTotal),
      expenseTotal: round2(input.expenseTotal),
      profitTotal: round2(profitTotal),
      nftProfitPool: round2(nftProfitPool),
      buybackUtt: round2(buybackUtt),
      buybackUshark: round2(buybackUshark),
      teamPool: round2(teamPool),
      treasuryPool: round2(treasuryPool),
    },
    nftProfit,
    teamPayouts,
    salesSplit,
  };
}

export async function getActiveRules(month: Date) {
  const [allocationRule, tierRule, saleSplitRule] = await Promise.all([
    prisma.allocationRule.findFirst({
      where: { validFrom: { lte: month } },
      orderBy: { validFrom: "desc" },
    }),
    prisma.nftTierRule.findFirst({
      where: { validFrom: { lte: month } },
      orderBy: { validFrom: "desc" },
    }),
    prisma.nftSaleSplitRule.findFirst({
      where: { validFrom: { lte: month } },
      orderBy: { validFrom: "desc" },
    }),
  ]);

  if (!allocationRule || !tierRule || !saleSplitRule) {
    throw new Error("RULES_NOT_CONFIGURED");
  }

  return { allocationRule, tierRule, saleSplitRule };
}

export async function getMonthlyDashboard(month: Date) {
  const [incomeRows, expenseRows, nftSalesRows, teamMembers, rules] =
    await Promise.all([
      prisma.incomeEntry.findMany({
        where: { month, status: "APPROVED" },
        select: { amountUsd: true },
      }),
      prisma.expenseEntry.findMany({
        where: { month, status: "APPROVED" },
        select: { amountUsd: true },
      }),
      prisma.nftMonthlySale.findMany({
        where: { month, status: "APPROVED" },
        select: { tier: true, soldCount: true, unitPriceUsd: true },
      }),
      prisma.teamMember.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      getActiveRules(month),
    ]);

  const incomeTotal = incomeRows.reduce((sum, row) => sum + toNumber(row.amountUsd), 0);
  const expenseTotal = expenseRows.reduce((sum, row) => sum + toNumber(row.amountUsd), 0);

  const tierCounts: TierCounts = { bronze: 0, silver: 0, gold: 0 };
  let bronzeUsd = 0;
  let silverUsd = 0;
  let goldUsd = 0;

  for (const row of nftSalesRows) {
    const rowUsd = row.soldCount * toNumber(row.unitPriceUsd);

    if (row.tier === "BRONZE") {
      tierCounts.bronze += row.soldCount;
      bronzeUsd += rowUsd;
    }

    if (row.tier === "SILVER") {
      tierCounts.silver += row.soldCount;
      silverUsd += rowUsd;
    }

    if (row.tier === "GOLD") {
      tierCounts.gold += row.soldCount;
      goldUsd += rowUsd;
    }
  }

  return computeMonthlyKpis({
    month,
    incomeTotal,
    expenseTotal,
    tierCounts,
    allocationRule: rules.allocationRule,
    tierRule: rules.tierRule,
    saleSplitRule: rules.saleSplitRule,
    teamMembers,
    nftSalesByTier: {
      bronzeUsd,
      silverUsd,
      goldUsd,
      totalUsd: bronzeUsd + silverUsd + goldUsd,
    },
  });
}

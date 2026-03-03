import { describe, expect, it } from "vitest";
import { computeMonthlyKpis } from "@/lib/calculations";

describe("computeMonthlyKpis", () => {
  it("computes allocation, nft payouts and team payouts correctly", () => {
    const result = computeMonthlyKpis({
      month: new Date("2026-02-01T00:00:00.000Z"),
      incomeTotal: 17045.48,
      expenseTotal: 1706,
      tierCounts: { bronze: 1530, silver: 96, gold: 500 },
      allocationRule: {
        id: "r1",
        validFrom: new Date("2025-01-01T00:00:00.000Z"),
        nftPoolPct: "0.5",
        buybackUttPct: "0.05",
        buybackUsharkPct: "0.05",
        teamPct: "0.2",
        treasuryPct: "0.2",
        createdAt: new Date(),
      },
      tierRule: {
        id: "t1",
        validFrom: new Date("2025-01-01T00:00:00.000Z"),
        bronzeMultiplier: "1",
        silverMultiplier: "2",
        goldMultiplier: "4",
        createdAt: new Date(),
      },
      saleSplitRule: {
        id: "s1",
        validFrom: new Date("2025-01-01T00:00:00.000Z"),
        tradingPct: "0.75",
        infrastructurePct: "0.15",
        operationsPct: "0.1",
        createdAt: new Date(),
      },
      teamMembers: [
        {
          id: "m1",
          name: "Benjamin",
          payoutPct: "0.35",
          walletChain: null,
          walletAddress: null,
          isActive: true,
          validFrom: new Date(),
          createdAt: new Date(),
        },
        {
          id: "m2",
          name: "Mario",
          payoutPct: "0.35",
          walletChain: null,
          walletAddress: null,
          isActive: true,
          validFrom: new Date(),
          createdAt: new Date(),
        },
      ],
      nftSalesByTier: {
        bronzeUsd: 286875,
        silverUsd: 36000,
        goldUsd: 375000,
        totalUsd: 697875,
      },
    });

    expect(result.totals.profitTotal).toBeCloseTo(15339.48, 2);
    expect(result.totals.nftProfitPool).toBeCloseTo(7669.74, 2);
    expect(result.totals.teamPool).toBeCloseTo(3067.9, 2);
    expect(result.nftProfit.totalShares).toBe(3722);
    expect(result.nftProfit.bronze.perNft).toBeGreaterThan(2);
    expect(result.teamPayouts).toHaveLength(2);
    expect(result.salesSplit.tradingUsd).toBeCloseTo(523406.25, 2);
  });
});

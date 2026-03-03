import { describe, expect, it } from "vitest";
import { ensurePctSumIsOne } from "@/lib/rules";
import { monthStringToDate } from "@/lib/month";
import {
  allocationRuleCreateSchema,
  incomeCreateSchema,
  expenseCreateSchema,
  nftSaleCreateSchema,
  teamMemberPatchSchema,
} from "@/lib/validation";
import { buildMonthOptions } from "@/lib/month-options";

describe("validation and rules", () => {
  it("accepts valid month and rejects invalid month", () => {
    expect(monthStringToDate("2026-02").toISOString()).toContain("2026-02-01");
    expect(() => monthStringToDate("02-2026")).toThrow();
  });

  it("validates core create schemas", () => {
    expect(() =>
      incomeCreateSchema.parse({
        month: "2026-02",
        source: "PIONEX_BOTS",
        amountUsd: 100,
      }),
    ).not.toThrow();

    expect(() =>
      expenseCreateSchema.parse({
        month: "2026-02",
        category: "Marketing",
        vendor: "Metricool",
        costType: "MONTHLY",
        amountUsd: 20,
      }),
    ).not.toThrow();

    expect(() =>
      nftSaleCreateSchema.parse({
        month: "2026-02",
        tier: "GOLD",
        soldCount: 2,
        unitPriceUsd: 1000,
      }),
    ).not.toThrow();
  });

  it("enforces percent sum 1.0", () => {
    const payload = allocationRuleCreateSchema.parse({
      validFrom: "2026-02",
      nftPoolPct: 0.5,
      buybackUttPct: 0.05,
      buybackUsharkPct: 0.05,
      teamPct: 0.2,
      treasuryPct: 0.2,
    });

    expect(() =>
      ensurePctSumIsOne([
        payload.nftPoolPct,
        payload.buybackUttPct,
        payload.buybackUsharkPct,
        payload.teamPct,
        payload.treasuryPct,
      ]),
    ).not.toThrow();

    expect(() => ensurePctSumIsOne([0.5, 0.3], "Testwerte")).toThrow(
      "Testwerte müssen zusammen 1.0 ergeben",
    );
  });

  it("builds deduplicated month options in descending order", () => {
    const result = buildMonthOptions([
      new Date("2026-02-01T00:00:00.000Z"),
      new Date("2025-11-01T00:00:00.000Z"),
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-02-01T00:00:00.000Z"),
    ]);

    expect(result).toEqual(["2026-02", "2026-01", "2025-11"]);
  });

  it("validates team member patch payload", () => {
    expect(() =>
      teamMemberPatchSchema.parse({
        name: "Benjamin",
        payoutPct: 0.4,
        walletChain: "Solana",
        walletAddress: "abc123",
        isActive: true,
        validFrom: "2026-03",
      }),
    ).not.toThrow();

    expect(() =>
      teamMemberPatchSchema.parse({
        payoutPct: 1.4,
      }),
    ).toThrow();
  });
});

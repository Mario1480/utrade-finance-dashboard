import { describe, expect, it } from "vitest";
import { TokenType } from "@prisma/client";
import {
  aggregateBurningRows,
  computeCommunityTotals,
  selectPublishedMonths,
} from "@/lib/community-dashboard";

describe("community dashboard helpers", () => {
  it("filters published months by closed state and current month", () => {
    const result = selectPublishedMonths(
      ["2026-03", "2026-02", "2026-01", "2025-12"],
      {
        "2026-03": { isClosed: false },
        "2026-02": { isClosed: true },
        "2026-01": { isClosed: true },
        "2025-12": { isClosed: true },
      },
      "2026-02",
    );

    expect(result).toEqual(["2026-02", "2026-01", "2025-12"]);
  });

  it("aggregates burning by month and token", () => {
    const rows = aggregateBurningRows([
      {
        month: new Date("2026-02-01T00:00:00.000Z"),
        token: TokenType.UTT,
        amountToken: 100,
        txUrl: "https://x/1",
      },
      {
        month: new Date("2026-02-01T00:00:00.000Z"),
        token: TokenType.USHARK,
        amountToken: 2000,
        txUrl: "https://x/2",
      },
      {
        month: new Date("2026-02-01T00:00:00.000Z"),
        token: TokenType.UTT,
        amountToken: 50,
        txUrl: "https://x/3",
      },
      {
        month: new Date("2026-01-01T00:00:00.000Z"),
        token: TokenType.UTT,
        amountToken: 20,
        txUrl: "https://x/4",
      },
    ]);

    expect(rows[0].month).toBe("2026-02");
    expect(rows[0].uttAmount).toBe(150);
    expect(rows[0].usharkAmount).toBe(2000);
    expect(rows[0].txLinksUtt).toHaveLength(2);
    expect(rows[1].month).toBe("2026-01");
  });

  it("computes totals across monthly rows", () => {
    const totals = computeCommunityTotals(
      [
        {
          month: "2026-02",
          nftPoolTotal: 100,
          bronzeTotal: 20,
          silverTotal: 30,
          goldTotal: 50,
          bronzePerNft: 1,
          silverPerNft: 2,
          goldPerNft: 4,
        },
        {
          month: "2026-01",
          nftPoolTotal: 200,
          bronzeTotal: 40,
          silverTotal: 60,
          goldTotal: 100,
          bronzePerNft: 1,
          silverPerNft: 2,
          goldPerNft: 4,
        },
      ],
      [
        {
          month: "2026-02",
          uttAmount: 1000,
          usharkAmount: 2000,
          txLinksUtt: [],
          txLinksUshark: [],
        },
      ],
      [
        { month: "2026-02", profitTotal: 1000 },
        { month: "2026-01", profitTotal: 500 },
      ],
    );

    expect(totals.profitAllMonths).toBe(1500);
    expect(totals.nftPoolAllMonths).toBe(300);
    expect(totals.profitBronzeAllMonths).toBe(60);
    expect(totals.profitSilverAllMonths).toBe(90);
    expect(totals.profitGoldAllMonths).toBe(150);
    expect(totals.burningTotalUtt).toBe(1000);
    expect(totals.burningTotalUshark).toBe(2000);
  });
});

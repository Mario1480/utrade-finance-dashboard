import { parse } from "csv-parse/sync";
import { PrismaClient, EntryStatus, IncomeSource } from "@prisma/client";

const prisma = new PrismaClient();

const SHEET_ID = "1_5PyaWgGILaD1IgobTodVzuBCENXlZLq7cwgdGMBI_g";
const GIDS = {
  main: "0",
  expenses: "391207025",
  income: "1944906785",
  team: "331109004",
  nftSales: "585163270",
  burning: "1512991576",
  addresses: "98015876",
} as const;

function parseGermanNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!cleaned) {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }

  const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseMonthLabel(label: string): Date | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }

  const map: Record<string, string> = {
    Januar: "01",
    February: "02",
    Februar: "02",
    March: "03",
    Marz: "03",
    April: "04",
    May: "05",
    Mai: "05",
    June: "06",
    Juni: "06",
    July: "07",
    Juli: "07",
    August: "08",
    September: "09",
    Oktober: "10",
    October: "10",
    November: "11",
    Dezember: "12",
    December: "12",
    January: "01",
  };

  const [monthName, year] = trimmed.split(" ");
  if (!monthName || !year) {
    return null;
  }

  const month = map[monthName];
  if (!month) {
    return null;
  }

  return new Date(`${year}-${month}-01T00:00:00.000Z`);
}

async function fetchCsv(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CSV Download fehlgeschlagen (${gid})`);
  }

  const text = await response.text();
  return parse(text, {
    skip_empty_lines: false,
  }) as string[][];
}

async function getMigrationActorId() {
  const actor = await prisma.user.findFirst({
    where: { role: "SUPERADMIN" },
    orderBy: { createdAt: "asc" },
  });

  if (!actor) {
    throw new Error("Kein Superadmin gefunden. Bitte zuerst Seed ausführen.");
  }

  return actor.id;
}

async function importIncome(actorId: string): Promise<number> {
  const rows = await fetchCsv(GIDS.income);
  let count = 0;

  await prisma.incomeEntry.deleteMany({ where: { source: IncomeSource.MIGRATION } });

  for (const row of rows) {
    const month = parseMonthLabel(row[0] ?? "");
    if (!month) {
      continue;
    }

    const columns: Array<[IncomeSource, string]> = [
      [IncomeSource.PIONEX_BOTS, row[1] ?? ""],
      [IncomeSource.COPY_BINGX, row[2] ?? ""],
      [IncomeSource.COPY_MEXC, row[3] ?? ""],
    ];

    for (const [source, raw] of columns) {
      const amount = parseGermanNumber(raw);
      if (amount === null || amount === 0) {
        continue;
      }

      await prisma.incomeEntry.create({
        data: {
          month,
          source,
          amountUsd: amount,
          note: "[MIGRATION] Google Sheet Import",
          status: EntryStatus.APPROVED,
          createdById: actorId,
          approvedById: actorId,
          approvedAt: new Date(),
        },
      });

      count += 1;
    }
  }

  return count;
}

async function importExpenses(actorId: string): Promise<number> {
  const rows = await fetchCsv(GIDS.expenses);
  let count = 0;

  await prisma.expenseEntry.deleteMany({
    where: {
      note: {
        startsWith: "[MIGRATION]",
      },
    },
  });

  const headerRow = rows.find((row) => row.includes("September 2025"));
  if (!headerRow) {
    throw new Error("Kosten-Headerzeile nicht gefunden");
  }

  const monthColumns = headerRow
    .map((value, index) => ({ value, index }))
    .filter((item) => parseMonthLabel(item.value) !== null);

  for (const row of rows) {
    const category = (row[0] ?? "").trim();
    if (!category || category === "Kosten") {
      continue;
    }

    for (const column of monthColumns) {
      const month = parseMonthLabel(column.value);
      if (!month) {
        continue;
      }

      const amount = parseGermanNumber(row[column.index] ?? "");
      if (amount === null || amount === 0) {
        continue;
      }

      await prisma.expenseEntry.create({
        data: {
          month,
          category,
          vendor: category,
          costType: "MONTHLY",
          amountUsd: amount,
          note: "[MIGRATION] Google Sheet Import",
          status: EntryStatus.APPROVED,
          createdById: actorId,
          approvedById: actorId,
          approvedAt: new Date(),
        },
      });

      count += 1;
    }
  }

  return count;
}

async function importNftFromMain(actorId: string): Promise<number> {
  const rows = await fetchCsv(GIDS.main);
  let count = 0;

  for (const row of rows) {
    const month = parseMonthLabel(row[0] ?? "");
    if (!month) {
      continue;
    }

    const tierData: Array<{ tier: "BRONZE" | "SILVER" | "GOLD"; countIndex: number; totalProfitIndex: number }> = [
      { tier: "BRONZE", countIndex: 11, totalProfitIndex: 13 },
      { tier: "SILVER", countIndex: 16, totalProfitIndex: 18 },
      { tier: "GOLD", countIndex: 21, totalProfitIndex: 23 },
    ];

    for (const item of tierData) {
      const soldCount = parseGermanNumber(row[item.countIndex] ?? "");
      const totalProfit = parseGermanNumber(row[item.totalProfitIndex] ?? "");

      if (soldCount === null || soldCount <= 0) {
        continue;
      }

      const unitPrice = totalProfit && soldCount > 0 ? totalProfit / soldCount : 0;

      await prisma.nftMonthlySale.upsert({
        where: {
          month_tier: {
            month,
            tier: item.tier,
          },
        },
        update: {
          soldCount: Math.round(soldCount),
          unitPriceUsd: unitPrice,
          status: EntryStatus.APPROVED,
          approvedById: actorId,
          approvedAt: new Date(),
        },
        create: {
          month,
          tier: item.tier,
          soldCount: Math.round(soldCount),
          unitPriceUsd: unitPrice,
          status: EntryStatus.APPROVED,
          createdById: actorId,
          approvedById: actorId,
          approvedAt: new Date(),
        },
      });

      count += 1;
    }
  }

  return count;
}

async function importBurning(actorId: string): Promise<number> {
  const rows = await fetchCsv(GIDS.burning);
  let count = 0;

  for (const row of rows) {
    const month = parseMonthLabel(row[0] ?? "");
    if (!month) {
      continue;
    }

    const utt = parseGermanNumber(row[1] ?? "");
    const uttLink = (row[2] ?? "").trim();
    const ushark = parseGermanNumber(row[3] ?? "");
    const usharkLink = (row[4] ?? "").trim();

    if (utt && uttLink) {
      const exists = await prisma.burningEntry.findFirst({
        where: { month, token: "UTT", txUrl: uttLink },
      });
      if (!exists) {
        await prisma.burningEntry.create({
          data: {
            month,
            token: "UTT",
            amountToken: utt,
            txUrl: uttLink,
            chain: "Solana",
            status: EntryStatus.APPROVED,
            createdById: actorId,
            approvedById: actorId,
            approvedAt: new Date(),
          },
        });
        count += 1;
      }
    }

    if (ushark && usharkLink) {
      const exists = await prisma.burningEntry.findFirst({
        where: { month, token: "USHARK", txUrl: usharkLink },
      });
      if (!exists) {
        await prisma.burningEntry.create({
          data: {
            month,
            token: "USHARK",
            amountToken: ushark,
            txUrl: usharkLink,
            chain: "Tron",
            status: EntryStatus.APPROVED,
            createdById: actorId,
            approvedById: actorId,
            approvedAt: new Date(),
          },
        });
        count += 1;
      }
    }
  }

  return count;
}

async function importAddresses(): Promise<number> {
  const rows = await fetchCsv(GIDS.addresses);
  let count = 0;

  for (const row of rows) {
    const label = (row[0] ?? "").trim();
    const amountRaw = (row[1] ?? "").trim();
    const asset = (row[2] ?? "").trim();
    const chain = (row[3] ?? "").trim();
    const address = (row[4] ?? "").trim();

    if (!label || !asset || !chain || !address) {
      continue;
    }

    const exists = await prisma.projectAddress.findFirst({
      where: { label, address },
    });

    if (exists) {
      continue;
    }

    await prisma.projectAddress.create({
      data: {
        label,
        amountValue: parseGermanNumber(amountRaw) ?? undefined,
        asset,
        chain,
        address,
        isActive: true,
      },
    });

    count += 1;
  }

  return count;
}

async function importTeamMembers(): Promise<number> {
  const rows = await fetchCsv(GIDS.team);
  let count = 0;

  const members: Array<{ name: string; payoutPct: number; chain: string; address: string }> = [];

  for (const row of rows) {
    const name = (row[0] ?? "").trim();
    const payoutRaw = (row[1] ?? "").trim();
    if (name && payoutRaw.endsWith("%")) {
      const number = Number(payoutRaw.replace("%", "")) / 100;
      members.push({ name, payoutPct: number, chain: "", address: "" });
    }

    if ((row[5] ?? "").trim() && (row[6] ?? "").trim() && (row[7] ?? "").trim()) {
      const walletName = (row[5] ?? "").trim();
      const existing = members.find((m) => m.name === walletName);
      if (existing) {
        existing.chain = (row[6] ?? "").trim();
        existing.address = (row[7] ?? "").trim();
      }
    }
  }

  for (const member of members) {
    const exists = await prisma.teamMember.findFirst({
      where: { name: member.name, isActive: true },
    });

    if (exists) {
      continue;
    }

    await prisma.teamMember.create({
      data: {
        name: member.name,
        payoutPct: member.payoutPct,
        walletChain: member.chain || undefined,
        walletAddress: member.address || undefined,
        validFrom: new Date("2025-01-01T00:00:00.000Z"),
      },
    });
    count += 1;
  }

  return count;
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function monthDate(value: string): Date {
  return new Date(`${value}-01T00:00:00.000Z`);
}

function currentUtcMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function backfillCommunityMonthStatus(): Promise<{
  monthCount: number;
  historicalClosed: number;
}> {
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

  const monthKeys = [...incomeMonths, ...expenseMonths, ...nftMonths].map((entry) =>
    monthKey(entry.month),
  );
  const uniqueKeys = [...new Set(monthKeys)].sort((a, b) => b.localeCompare(a));
  const currentMonth = currentUtcMonthStart();
  let historicalClosed = 0;

  for (const key of uniqueKeys) {
    const month = monthDate(key);
    const isHistorical = month < currentMonth;

    await prisma.communityMonthStatus.upsert({
      where: { month },
      update: {},
      create: {
        month,
        isClosed: isHistorical,
        closedAt: isHistorical ? new Date() : null,
        closedById: null,
      },
    });

    if (isHistorical) {
      historicalClosed += 1;
    }
  }

  return {
    monthCount: uniqueKeys.length,
    historicalClosed,
  };
}

async function main() {
  const actorId = await getMigrationActorId();

  const incomeCount = await importIncome(actorId);
  const expenseCount = await importExpenses(actorId);
  const nftCount = await importNftFromMain(actorId);
  const burningCount = await importBurning(actorId);
  const addressCount = await importAddresses();
  const teamCount = await importTeamMembers();
  const communityMonthStatus = await backfillCommunityMonthStatus();

  const summary = {
    incomeCount,
    expenseCount,
    nftCount,
    burningCount,
    addressCount,
    teamCount,
    communityMonthStatus,
    importedAt: new Date().toISOString(),
  };

  await prisma.auditLog.create({
    data: {
      actorUserId: actorId,
      entityType: "migration",
      entityId: "google-sheet",
      action: "IMPORT",
      afterJson: summary,
    },
  });

  console.log("Migration abgeschlossen:", summary);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

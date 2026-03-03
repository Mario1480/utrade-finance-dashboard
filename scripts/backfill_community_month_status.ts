import { EntryStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function getApprovedMonthKeys(): Promise<string[]> {
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

  const months = [...incomeMonths, ...expenseMonths, ...nftMonths].map((entry) =>
    monthKey(entry.month),
  );

  return [...new Set(months)].sort((a, b) => b.localeCompare(a));
}

async function main() {
  const monthKeys = await getApprovedMonthKeys();
  const currentMonth = currentUtcMonthStart();
  let closedCount = 0;

  for (const key of monthKeys) {
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
      closedCount += 1;
    }
  }

  console.log("Community-Monatsstatus Backfill abgeschlossen", {
    monthCount: monthKeys.length,
    historicalClosed: closedCount,
  });
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

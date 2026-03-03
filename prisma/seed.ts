import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL ?? "admin@utrade.local";
  const password = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Superadmin",
      passwordHash,
      role: UserRole.SUPERADMIN,
      isActive: true,
    },
    create: {
      email,
      name: "Superadmin",
      passwordHash,
      role: UserRole.SUPERADMIN,
      mustChangePassword: true,
    },
  });

  await prisma.allocationRule.upsert({
    where: { validFrom: new Date("2025-01-01T00:00:00.000Z") },
    update: {},
    create: {
      validFrom: new Date("2025-01-01T00:00:00.000Z"),
      nftPoolPct: "0.50",
      buybackUttPct: "0.05",
      buybackUsharkPct: "0.05",
      teamPct: "0.20",
      treasuryPct: "0.20",
    },
  });

  await prisma.nftTierRule.upsert({
    where: { validFrom: new Date("2025-01-01T00:00:00.000Z") },
    update: {},
    create: {
      validFrom: new Date("2025-01-01T00:00:00.000Z"),
      bronzeMultiplier: "1.0",
      silverMultiplier: "2.0",
      goldMultiplier: "4.0",
    },
  });

  await prisma.nftSaleSplitRule.upsert({
    where: { validFrom: new Date("2025-01-01T00:00:00.000Z") },
    update: {},
    create: {
      validFrom: new Date("2025-01-01T00:00:00.000Z"),
      tradingPct: "0.75",
      infrastructurePct: "0.15",
      operationsPct: "0.10",
    },
  });

  const teamDefaults = [
    { name: "Benjamin", payoutPct: "0.35" },
    { name: "Mario", payoutPct: "0.35" },
    { name: "Patrick", payoutPct: "0.30" },
  ];

  for (const member of teamDefaults) {
    const existing = await prisma.teamMember.findFirst({
      where: { name: member.name, isActive: true },
    });

    if (!existing) {
      await prisma.teamMember.create({
        data: {
          name: member.name,
          payoutPct: member.payoutPct,
          isActive: true,
          validFrom: new Date("2025-01-01T00:00:00.000Z"),
        },
      });
    }
  }
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

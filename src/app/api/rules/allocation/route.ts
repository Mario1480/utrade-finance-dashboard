import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { allocationRuleCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { toNumber } from "@/lib/number";
import { ensurePctSumIsOne } from "@/lib/rules";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const rows = await prisma.allocationRule.findMany({
      orderBy: { validFrom: "desc" },
    });

    return ok(
      rows.map((row) => ({
        ...row,
        nftPoolPct: toNumber(row.nftPoolPct),
        buybackUttPct: toNumber(row.buybackUttPct),
        buybackUsharkPct: toNumber(row.buybackUsharkPct),
        teamPct: toNumber(row.teamPct),
        treasuryPct: toNumber(row.treasuryPct),
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const payload = allocationRuleCreateSchema.parse(await request.json());

    ensurePctSumIsOne(
      [
        payload.nftPoolPct,
        payload.buybackUttPct,
        payload.buybackUsharkPct,
        payload.teamPct,
        payload.treasuryPct,
      ],
      "Prozentsätze",
    );

    const created = await prisma.allocationRule.create({
      data: {
        validFrom: monthStringToDate(payload.validFrom),
        nftPoolPct: payload.nftPoolPct,
        buybackUttPct: payload.buybackUttPct,
        buybackUsharkPct: payload.buybackUsharkPct,
        teamPct: payload.teamPct,
        treasuryPct: payload.treasuryPct,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "allocation_rule",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { writeAuditLog } from "@/lib/audit";
import { ensurePctSumIsOne } from "@/lib/rules";

const saleSplitSchema = z.object({
  validFrom: z.string().regex(/^\d{4}-\d{2}$/),
  tradingPct: z.number().min(0).max(1),
  infrastructurePct: z.number().min(0).max(1),
  operationsPct: z.number().min(0).max(1),
});

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const rows = await prisma.nftSaleSplitRule.findMany({
      orderBy: { validFrom: "desc" },
    });

    return ok(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const payload = saleSplitSchema.parse(await request.json());

    ensurePctSumIsOne(
      [payload.tradingPct, payload.infrastructurePct, payload.operationsPct],
      "Prozentsätze",
    );

    const created = await prisma.nftSaleSplitRule.create({
      data: {
        validFrom: monthStringToDate(payload.validFrom),
        tradingPct: payload.tradingPct,
        infrastructurePct: payload.infrastructurePct,
        operationsPct: payload.operationsPct,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "nft_sale_split_rule",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

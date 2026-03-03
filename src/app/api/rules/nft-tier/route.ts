import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { nftTierRuleCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const rows = await prisma.nftTierRule.findMany({
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
    const payload = nftTierRuleCreateSchema.parse(await request.json());

    const created = await prisma.nftTierRule.create({
      data: {
        validFrom: monthStringToDate(payload.validFrom),
        bronzeMultiplier: payload.bronzeMultiplier,
        silverMultiplier: payload.silverMultiplier,
        goldMultiplier: payload.goldMultiplier,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "nft_tier_rule",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

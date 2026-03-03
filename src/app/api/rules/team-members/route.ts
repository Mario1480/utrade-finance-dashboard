import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { teamMemberCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const rows = await prisma.teamMember.findMany({
      orderBy: [{ isActive: "desc" }, { validFrom: "desc" }, { name: "asc" }],
    });

    return ok(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const payload = teamMemberCreateSchema.parse(await request.json());

    const created = await prisma.teamMember.create({
      data: {
        name: payload.name,
        payoutPct: payload.payoutPct,
        walletChain: payload.walletChain,
        walletAddress: payload.walletAddress,
        validFrom: payload.validFrom
          ? monthStringToDate(payload.validFrom)
          : new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "team_member",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { teamMemberPatchSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const { id } = await context.params;
    const payload = teamMemberPatchSchema.parse(await request.json());

    const before = await prisma.teamMember.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Teammitglied nicht gefunden");
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        name: payload.name,
        payoutPct: payload.payoutPct,
        walletChain: payload.walletChain,
        walletAddress: payload.walletAddress,
        isActive: payload.isActive,
        validFrom: payload.validFrom ? monthStringToDate(payload.validFrom) : undefined,
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "team_member",
      entityId: id,
      action: "PATCH",
      beforeJson: before,
      afterJson: updated,
    });

    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { statusPatchSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const { id } = await context.params;
    const payload = statusPatchSchema.parse(await request.json());

    const before = await prisma.incomeEntry.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Eintrag nicht gefunden");
    }

    const updated = await prisma.incomeEntry.update({
      where: { id },
      data: {
        status: payload.status,
        note: payload.note ?? before.note,
        approvedById: payload.status === "APPROVED" ? user.id : null,
        approvedAt: payload.status === "APPROVED" ? new Date() : null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "income_entry",
      entityId: updated.id,
      action: `STATUS_${payload.status}`,
      beforeJson: before,
      afterJson: updated,
    });

    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

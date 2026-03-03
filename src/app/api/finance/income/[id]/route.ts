import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;

    const existing = await prisma.incomeEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Eintrag nicht gefunden");
    }

    if (user.role !== UserRole.SUPERADMIN && existing.createdById !== user.id) {
      throw new Error("FORBIDDEN");
    }

    await prisma.incomeEntry.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "income_entry",
      entityId: id,
      action: "DELETE",
      beforeJson: existing,
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

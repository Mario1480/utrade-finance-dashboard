import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { addressPatchSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const { id } = await context.params;
    const payload = addressPatchSchema.parse(await request.json());

    const before = await prisma.projectAddress.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Adresse nicht gefunden");
    }

    const updated = await prisma.projectAddress.update({
      where: { id },
      data: {
        label: payload.label,
        amountValue: payload.amountValue,
        asset: payload.asset,
        chain: payload.chain,
        address: payload.address,
        isActive: payload.isActive,
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "project_address",
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const { id } = await context.params;

    const before = await prisma.projectAddress.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Adresse nicht gefunden");
    }

    await prisma.projectAddress.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "project_address",
      entityId: id,
      action: "DELETE",
      beforeJson: before,
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

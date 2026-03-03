import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { userPatchSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const { id } = await context.params;
    const payload = userPatchSchema.parse(await request.json());

    const before = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!before) {
      throw new Error("User nicht gefunden");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        role: payload.role,
        isActive: payload.isActive,
        mustChangePassword: payload.mustChangePassword,
        passwordHash: payload.password
          ? await hashPassword(payload.password)
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "user",
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

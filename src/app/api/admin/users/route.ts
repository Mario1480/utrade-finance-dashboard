import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { userCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return ok(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const payload = userCreateSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new Error("E-Mail ist bereits vergeben");
    }

    const created = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        name: payload.name,
        role: payload.role,
        passwordHash: await hashPassword(payload.password),
        mustChangePassword: true,
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
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

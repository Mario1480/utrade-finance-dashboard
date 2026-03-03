import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import { handleRouteError } from "@/lib/route-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = changePasswordSchema.parse(await request.json());

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      throw new Error("UNAUTHORIZED");
    }

    const valid = await verifyPassword(payload.oldPassword, dbUser.passwordHash);
    if (!valid) {
      throw new Error("Altes Passwort ist falsch");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(payload.newPassword),
        mustChangePassword: false,
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

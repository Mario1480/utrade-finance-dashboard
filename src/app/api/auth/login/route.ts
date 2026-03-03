import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { handleRouteError } from "@/lib/route-utils";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = loginSchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new Error("Ungültige Login-Daten");
    }

    const valid = await verifyPassword(payload.password, user.passwordHash);
    if (!valid) {
      throw new Error("Ungültige Login-Daten");
    }

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
    });

    await setSessionCookie(token);

    return ok({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

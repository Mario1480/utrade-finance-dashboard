import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getRequestSession } from "@/lib/session";

export async function requireApiUser(
  request: NextRequest,
  options?: { roles?: UserRole[] },
): Promise<{ id: string; role: UserRole; email: string; name: string }> {
  const session = await getRequestSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (options?.roles && !options.roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, email: true, name: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

export function canModerate(role: UserRole): boolean {
  return role === UserRole.SUPERADMIN;
}

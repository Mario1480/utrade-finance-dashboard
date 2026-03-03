import { UserRole } from "@prisma/client";
import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth-guard";
import { ok } from "@/lib/api";
import {
  getCurrentUtcMonthStart,
  monthKeyToDate,
} from "@/lib/community-dashboard";
import { dateToMonthString } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { writeAuditLog } from "@/lib/audit";

const actionSchema = z.object({
  action: z.enum(["close", "open"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ month: string }> },
) {
  try {
    const actor = await requireApiUser(request);
    const { month } = await context.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Ungültiges Monat-Format (YYYY-MM)");
    }

    const { action } = actionSchema.parse(await request.json());
    if (action === "open" && actor.role !== UserRole.SUPERADMIN) {
      throw new Error("FORBIDDEN");
    }

    const monthDate = monthKeyToDate(month);
    const currentMonth = getCurrentUtcMonthStart();

    if (monthDate > currentMonth) {
      throw new Error("Zukünftige Monate können nicht geschlossen/geöffnet werden");
    }

    const before = await prisma.communityMonthStatus.findUnique({
      where: { month: monthDate },
    });

    if (!before) {
      await prisma.communityMonthStatus.create({
        data: {
          month: monthDate,
          isClosed: false,
        },
      });
    }

    const updated = await prisma.communityMonthStatus.update({
      where: { month: monthDate },
      data:
        action === "close"
          ? {
              isClosed: true,
              closedAt: new Date(),
              closedById: actor.id,
            }
          : {
              isClosed: false,
              closedAt: null,
              closedById: null,
            },
      include: {
        closedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "community_month_status",
      entityId: updated.id,
      action: action === "close" ? "CLOSE_MONTH" : "OPEN_MONTH",
      beforeJson: before,
      afterJson: updated,
    });

    return ok({
      month: dateToMonthString(updated.month),
      isClosed: updated.isClosed,
      closedAt: updated.closedAt,
      closedBy: updated.closedBy,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

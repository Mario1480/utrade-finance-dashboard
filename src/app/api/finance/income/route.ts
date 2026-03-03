import { NextRequest } from "next/server";
import { EntryStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { dateToMonthString, monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { incomeCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { toNumber } from "@/lib/number";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    const rows = await prisma.incomeEntry.findMany({
      where: user.role === UserRole.SUPERADMIN ? undefined : { createdById: user.id },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      take: 300,
      include: {
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    });

    return ok(
      rows.map((row) => ({
        id: row.id,
        month: dateToMonthString(row.month),
        source: row.source,
        amountUsd: toNumber(row.amountUsd),
        note: row.note,
        status: row.status,
        createdBy: row.createdBy.name,
        approvedBy: row.approvedBy?.name ?? null,
        approvedAt: row.approvedAt,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = incomeCreateSchema.parse(await request.json());

    const created = await prisma.incomeEntry.create({
      data: {
        month: monthStringToDate(payload.month),
        source: payload.source,
        amountUsd: payload.amountUsd,
        note: payload.note,
        status: EntryStatus.PENDING,
        createdById: user.id,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "income_entry",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const json = await request.json();

    const id = String(json.id ?? "");
    const payload = incomeCreateSchema.parse(json);
    if (!id) {
      throw new Error("id fehlt");
    }

    const existing = await prisma.incomeEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Eintrag nicht gefunden");
    }

    if (user.role !== UserRole.SUPERADMIN && existing.createdById !== user.id) {
      throw new Error("FORBIDDEN");
    }

    const updated = await prisma.incomeEntry.update({
      where: { id },
      data: {
        month: monthStringToDate(payload.month),
        source: payload.source,
        amountUsd: payload.amountUsd,
        note: payload.note,
        status: user.role === UserRole.SUPERADMIN ? existing.status : EntryStatus.PENDING,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "income_entry",
      entityId: updated.id,
      action: "PATCH",
      beforeJson: existing,
      afterJson: updated,
    });

    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

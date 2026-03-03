import { NextRequest } from "next/server";
import { EntryStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { dateToMonthString, monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { burningCreateSchema, statusPatchSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { toNumber } from "@/lib/number";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    const rows = await prisma.burningEntry.findMany({
      where: user.role === UserRole.SUPERADMIN ? undefined : { createdById: user.id },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    });

    return ok(
      rows.map((row) => ({
        id: row.id,
        month: dateToMonthString(row.month),
        token: row.token,
        amountToken: toNumber(row.amountToken),
        txUrl: row.txUrl,
        chain: row.chain,
        status: row.status,
        createdBy: row.createdBy.name,
        approvedBy: row.approvedBy?.name ?? null,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = burningCreateSchema.parse(await request.json());

    const created = await prisma.burningEntry.create({
      data: {
        month: monthStringToDate(payload.month),
        token: payload.token,
        amountToken: payload.amountToken,
        txUrl: payload.txUrl,
        chain: payload.chain,
        status: EntryStatus.PENDING,
        createdById: user.id,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "burning_entry",
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

    if (!id) {
      throw new Error("id fehlt");
    }

    const existing = await prisma.burningEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Eintrag nicht gefunden");
    }

    if ("status" in json) {
      if (user.role !== UserRole.SUPERADMIN) {
        throw new Error("FORBIDDEN");
      }

      const statusPayload = statusPatchSchema.parse(json);
      const updated = await prisma.burningEntry.update({
        where: { id },
        data: {
          status: statusPayload.status,
          approvedById: statusPayload.status === "APPROVED" ? user.id : null,
          approvedAt: statusPayload.status === "APPROVED" ? new Date() : null,
        },
      });

      await writeAuditLog({
        actorUserId: user.id,
        entityType: "burning_entry",
        entityId: updated.id,
        action: `STATUS_${statusPayload.status}`,
        beforeJson: existing,
        afterJson: updated,
      });

      return ok(updated);
    }

    const payload = burningCreateSchema.parse(json);

    if (user.role !== UserRole.SUPERADMIN) {
      if (existing.createdById !== user.id) {
        throw new Error("FORBIDDEN");
      }

      if (
        existing.status !== EntryStatus.PENDING &&
        existing.status !== EntryStatus.REJECTED
      ) {
        throw new Error("Nur Pending/Rejected Einträge sind editierbar");
      }
    }

    const updated = await prisma.burningEntry.update({
      where: { id },
      data: {
        month: monthStringToDate(payload.month),
        token: payload.token,
        amountToken: payload.amountToken,
        txUrl: payload.txUrl,
        chain: payload.chain,
        status: user.role === UserRole.SUPERADMIN ? existing.status : EntryStatus.PENDING,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "burning_entry",
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

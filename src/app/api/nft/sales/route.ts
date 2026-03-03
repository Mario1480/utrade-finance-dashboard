import { NextRequest } from "next/server";
import { EntryStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { dateToMonthString, monthStringToDate } from "@/lib/month";
import { handleRouteError } from "@/lib/route-utils";
import { nftSaleCreateSchema, statusPatchSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { toNumber } from "@/lib/number";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    const rows = await prisma.nftMonthlySale.findMany({
      where: user.role === UserRole.SUPERADMIN ? undefined : { createdById: user.id },
      orderBy: [{ month: "desc" }, { tier: "asc" }],
      include: {
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    });

    return ok(
      rows.map((row) => ({
        id: row.id,
        month: dateToMonthString(row.month),
        tier: row.tier,
        soldCount: row.soldCount,
        unitPriceUsd: toNumber(row.unitPriceUsd),
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
    const payload = nftSaleCreateSchema.parse(await request.json());

    const created = await prisma.nftMonthlySale.create({
      data: {
        month: monthStringToDate(payload.month),
        tier: payload.tier,
        soldCount: payload.soldCount,
        unitPriceUsd: payload.unitPriceUsd,
        status: EntryStatus.PENDING,
        createdById: user.id,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "nft_monthly_sale",
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

    const existing = await prisma.nftMonthlySale.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Eintrag nicht gefunden");
    }

    if ("status" in json) {
      if (user.role !== UserRole.SUPERADMIN) {
        throw new Error("FORBIDDEN");
      }

      const statusPayload = statusPatchSchema.parse(json);
      const updated = await prisma.nftMonthlySale.update({
        where: { id },
        data: {
          status: statusPayload.status,
          approvedById: statusPayload.status === "APPROVED" ? user.id : null,
          approvedAt: statusPayload.status === "APPROVED" ? new Date() : null,
        },
      });

      await writeAuditLog({
        actorUserId: user.id,
        entityType: "nft_monthly_sale",
        entityId: updated.id,
        action: `STATUS_${statusPayload.status}`,
        beforeJson: existing,
        afterJson: updated,
      });

      return ok(updated);
    }

    const payload = nftSaleCreateSchema.parse(json);

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

    const updated = await prisma.nftMonthlySale.update({
      where: { id },
      data: {
        month: monthStringToDate(payload.month),
        tier: payload.tier,
        soldCount: payload.soldCount,
        unitPriceUsd: payload.unitPriceUsd,
        status: user.role === UserRole.SUPERADMIN ? existing.status : EntryStatus.PENDING,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "nft_monthly_sale",
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

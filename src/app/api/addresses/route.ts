import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-guard";
import { handleRouteError } from "@/lib/route-utils";
import { addressCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { toNumber } from "@/lib/number";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);

    const rows = await prisma.projectAddress.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok(
      rows.map((row) => ({
        ...row,
        amountValue:
          row.amountValue === null ? null : toNumber(row.amountValue),
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request, { roles: [UserRole.SUPERADMIN] });
    const payload = addressCreateSchema.parse(await request.json());

    const created = await prisma.projectAddress.create({
      data: {
        label: payload.label,
        amountValue: payload.amountValue,
        asset: payload.asset,
        chain: payload.chain,
        address: payload.address,
        isActive: payload.isActive ?? true,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "project_address",
      entityId: created.id,
      action: "CREATE",
      afterJson: created,
    });

    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

import { prisma } from "@/lib/db";

type AuditInput = {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeJson: input.beforeJson as object | undefined,
      afterJson: input.afterJson as object | undefined,
    },
  });
}

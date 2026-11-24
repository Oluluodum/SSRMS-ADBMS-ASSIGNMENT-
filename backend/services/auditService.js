import { prisma } from '../config/prisma.js';

export function writeAuditLog({ userId = null, action, entity, entityId = null, details = undefined }, database = prisma) {
  return database.auditLog.create({
    data: { userId, action, entity, entityId, details }
  });
}

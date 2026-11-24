import { prisma } from '../config/prisma.js';

export async function listAuditLogs(req, res, next) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { fullName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}

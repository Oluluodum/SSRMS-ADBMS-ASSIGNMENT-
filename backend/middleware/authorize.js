import { writeAuditLog } from '../services/auditService.js';

export function authorize(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      try {
        await writeAuditLog({
          userId: req.user?.id,
          action: 'ACCESS_DENIED',
          entity: 'API',
          details: { method: req.method, path: req.path }
        });
      } catch (error) {
        return next(error);
      }
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

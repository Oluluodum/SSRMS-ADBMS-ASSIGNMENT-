import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export async function authenticate(req, res, next) {
  const token = req.cookies?.ssrms_token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'ssrms' });
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, fullName: true, email: true, role: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'User account is unavailable.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
    return next(error);
  }
}

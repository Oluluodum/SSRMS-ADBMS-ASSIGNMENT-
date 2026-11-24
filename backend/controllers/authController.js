import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { writeAuditLog } from '../services/auditService.js';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128)
});
const dummyPasswordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function login(req, res, next) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Enter a valid email address and password.' });
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? dummyPasswordHash);

    if (!user || !validPassword) {
      await writeAuditLog({ action: 'LOGIN_FAILED', entity: 'User', details: { reason: 'invalid_credentials' } });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: user.id,
      expiresIn: '2h',
      issuer: 'ssrms'
    });
    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id
    });

    res.cookie('ssrms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
}

export function currentUser(req, res) {
  res.json({ user: req.user });
}

export function logout(req, res) {
  res.clearCookie('ssrms_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.status(204).end();
}

import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { prisma } from './config/prisma.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured.');
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  throw new Error('JWT_SECRET must contain at least 32 bytes.');
}

const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(express.static(resolve(currentDirectory, '..', 'frontend')));
app.get('/api/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => console.log(`SSRMS listening on http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

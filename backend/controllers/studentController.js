import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { writeAuditLog } from '../services/auditService.js';

const studentFields = {
  studentNumber: z.string().trim().min(2).max(30),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  programme: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  grade: z.number().min(0).max(100).nullable().optional()
};
const createSchema = z.strictObject(studentFields);
const updateSchema = z.strictObject(studentFields).partial().refine((value) => Object.keys(value).length > 0);
const gradeSchema = z.strictObject({ grade: z.number().min(0).max(100).nullable() });

function parseId(req, res) {
  const parsed = z.string().uuid().safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: 'Student ID must be a valid UUID.' });
    return null;
  }
  return parsed.data;
}

function handleValidation(parsed, res) {
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid student data.',
      details: parsed.error.issues.map(({ path, message }) => ({ field: path.join('.'), message }))
    });
    return false;
  }
  return true;
}

function handleDatabaseError(error, res, next) {
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Student number or email already exists.' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Student not found.' });
  }
  return next(error);
}

export async function listStudents(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const where = search ? {
      OR: [
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { programme: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : undefined;
    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({ where, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }], take: 200 }),
      prisma.student.count({ where })
    ]);
    res.json({ students, total });
  } catch (error) {
    next(error);
  }
}

export async function getStudent(req, res, next) {
  const id = parseId(req, res);
  if (!id) return;
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    return res.json({ student });
  } catch (error) {
    return next(error);
  }
}

export async function createStudent(req, res, next) {
  const parsed = createSchema.safeParse(req.body);
  if (!handleValidation(parsed, res)) return;
  try {
    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({ data: parsed.data });
      await writeAuditLog({
        userId: req.user.id, action: 'STUDENT_CREATED', entity: 'Student', entityId: created.id
      }, tx);
      return created;
    });
    return res.status(201).json({ student });
  } catch (error) {
    return handleDatabaseError(error, res, next);
  }
}

export async function updateStudent(req, res, next) {
  const id = parseId(req, res);
  if (!id) return;

  const isLecturer = req.user.role === 'LECTURER';
  if (isLecturer && Object.keys(req.body).some((field) => field !== 'grade')) {
    return res.status(403).json({ error: 'Lecturers may only update student grades.' });
  }
  const parsed = (isLecturer ? gradeSchema : updateSchema).safeParse(req.body);
  if (!handleValidation(parsed, res)) return;

  try {
    const student = await prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({ where: { id }, data: parsed.data });
      await writeAuditLog({
        userId: req.user.id,
        action: isLecturer ? 'STUDENT_GRADE_UPDATED' : 'STUDENT_UPDATED',
        entity: 'Student',
        entityId: updated.id,
        details: { fields: Object.keys(parsed.data) }
      }, tx);
      return updated;
    });
    return res.json({ student });
  } catch (error) {
    return handleDatabaseError(error, res, next);
  }
}

export async function deleteStudent(req, res, next) {
  const id = parseId(req, res);
  if (!id) return;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await writeAuditLog({ userId: req.user.id, action: 'STUDENT_DELETED', entity: 'Student', entityId: id }, tx);
    });
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(error, res, next);
  }
}

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL }
  }
});

const users = [
  { fullName: 'Alex Administrator', email: 'admin@ssrms.test', password: 'AdminDemo!2468', role: 'ADMINISTRATOR' },
  { fullName: 'Lee Lecturer', email: 'lecturer@ssrms.test', password: 'LecturerDemo!2468', role: 'LECTURER' },
  { fullName: 'Sam Viewer', email: 'viewer@ssrms.test', password: 'ViewerDemo!2468', role: 'VIEWER' }
];

const students = [
  { studentNumber: 'ZUT-DEMO-001', firstName: 'Mwaka', lastName: 'Banda', programme: 'Information Systems', email: 'm.banda@student.example', grade: 82.5 },
  { studentNumber: 'ZUT-DEMO-002', firstName: 'Chola', lastName: 'Phiri', programme: 'Computer Science', email: 'c.phiri@student.example', grade: 74.0 },
  { studentNumber: 'ZUT-DEMO-003', firstName: 'Leya', lastName: 'Zulu', programme: 'Business Computing', email: 'l.zulu@student.example', grade: 91.25 }
];

try {
  for (const user of users) {
    const { password, ...userData } = user;
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...userData, passwordHash: await bcrypt.hash(password, 12) },
      create: { ...userData, passwordHash: await bcrypt.hash(password, 12) }
    });
  }

  for (const student of students) {
    await prisma.student.upsert({
      where: { studentNumber: student.studentNumber },
      update: student,
      create: student
    });
  }
  console.log('Seed complete: three demo users and three fictional students are ready.');
} finally {
  await prisma.$disconnect();
}

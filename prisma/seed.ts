import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AttendIQ database (clean start)...');

  // Wipe all existing data for a fresh start
  await prisma.lectureInstance.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.semester.deleteMany({});

  // Create or update demo user
  const user = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: {},
    create: {
      email: 'student@college.edu',
      name: 'Student',
      password: 'password123',
    },
  });

  // Create default active semester (current month scope)
  const now = new Date();
  const startDate = subDays(now, 30);
  const endDate = addDays(now, 120);

  await prisma.semester.create({
    data: {
      userId: user.id,
      name: 'Current Semester',
      startDate,
      endDate,
      isActive: true,
    },
  });

  console.log('✓ Created user and active semester.');
  console.log('  → Add your own subjects from the "Subjects & Bunk Engine" page.');
  console.log('  → Build your timetable from the "Timetable Builder" page.');
  console.log('  → Lectures will auto-generate once your timetable is set up.');
  console.log('');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

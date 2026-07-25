import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AttendIQ database (clean start)...');

  await prisma.lectureInstance.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.semester.deleteMany({});

  await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: {},
    create: {
      email: 'student@college.edu',
      name: 'Student',
      password: 'password123',
    },
  });

  console.log('Created demo user.');
  console.log('First, create a semester in the Timetable Builder.');
  console.log('Then add recurring lectures through its end date.');
  console.log('Database seeded successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

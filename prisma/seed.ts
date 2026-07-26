/**
 * AttendIQ seed script
 *
 * Users are managed by Supabase Auth — create them via the Supabase Dashboard
 * or the Auth API, then paste the resulting UUID below to seed business data.
 *
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AttendIQ database...');

  // Clean all business data
  await prisma.lectureInstance.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.semester.deleteMany({});

  console.log('All business data cleared.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Sign up via the app at http://localhost:3000/signup');
  console.log('  2. Confirm your email via the link Supabase sends');
  console.log('  3. Go to /timetable to create your first semester');
  console.log('');
  console.log('Database seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

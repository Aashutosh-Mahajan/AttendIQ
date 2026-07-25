import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfWeek, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AttendIQ database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'alex@college.edu' },
    update: {},
    create: {
      email: 'alex@college.edu',
      name: 'Alex Rivera',
      password: 'password123', // In real auth, hashed
    },
  });

  // Create default active semester
  const now = new Date();
  const startDate = subDays(now, 30);
  const endDate = addDays(now, 90);

  // Deactivate any existing semesters
  await prisma.semester.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });

  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      name: 'Spring 2026 Semester',
      startDate,
      endDate,
      isActive: true,
    },
  });

  // Create subjects
  const subjectsData = [
    { name: 'Data Structures & Algorithms', code: 'CS301', color: '#6366f1', targetPercentage: 75 },
    { name: 'Operating Systems', code: 'CS302', color: '#06b6d4', targetPercentage: 75 },
    { name: 'Database Management Systems', code: 'CS303', color: '#10b981', targetPercentage: 80 },
    { name: 'Computer Networks', code: 'CS304', color: '#f59e0b', targetPercentage: 75 },
    { name: 'Software Engineering', code: 'CS305', color: '#ec4899', targetPercentage: 75 },
  ];

  const createdSubjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        ...s,
      },
    });
    createdSubjects.push(subject);
  }

  // Create timetable slots (Mon to Fri)
  // Mon: DS (09:00), OS (10:30), DBMS (13:00)
  // Tue: CN (09:00), SE (10:30), DS (13:00)
  // Wed: OS (09:00), DBMS (10:30), CN (13:00)
  // Thu: SE (09:00), DS (10:30), OS (13:00)
  // Fri: DBMS (09:00), CN (10:30), SE (13:00)

  const slots = [
    { subject: createdSubjects[0], dayOfWeek: 1, startTime: '09:00', endTime: '10:15', room: 'Lab 101' },
    { subject: createdSubjects[1], dayOfWeek: 1, startTime: '10:30', endTime: '11:45', room: 'Hall A' },
    { subject: createdSubjects[2], dayOfWeek: 1, startTime: '13:00', endTime: '14:15', room: 'Lab 204' },

    { subject: createdSubjects[3], dayOfWeek: 2, startTime: '09:00', endTime: '10:15', room: 'Hall B' },
    { subject: createdSubjects[4], dayOfWeek: 2, startTime: '10:30', endTime: '11:45', room: 'Room 302' },
    { subject: createdSubjects[0], dayOfWeek: 2, startTime: '13:00', endTime: '14:15', room: 'Lab 101' },

    { subject: createdSubjects[1], dayOfWeek: 3, startTime: '09:00', endTime: '10:15', room: 'Hall A' },
    { subject: createdSubjects[2], dayOfWeek: 3, startTime: '10:30', endTime: '11:45', room: 'Lab 204' },
    { subject: createdSubjects[3], dayOfWeek: 3, startTime: '13:00', endTime: '14:15', room: 'Hall B' },

    { subject: createdSubjects[4], dayOfWeek: 4, startTime: '09:00', endTime: '10:15', room: 'Room 302' },
    { subject: createdSubjects[0], dayOfWeek: 4, startTime: '10:30', endTime: '11:45', room: 'Lab 101' },
    { subject: createdSubjects[1], dayOfWeek: 4, startTime: '13:00', endTime: '14:15', room: 'Hall A' },

    { subject: createdSubjects[2], dayOfWeek: 5, startTime: '09:00', endTime: '10:15', room: 'Lab 204' },
    { subject: createdSubjects[3], dayOfWeek: 5, startTime: '10:30', endTime: '11:45', room: 'Hall B' },
    { subject: createdSubjects[4], dayOfWeek: 5, startTime: '13:00', endTime: '14:15', room: 'Room 302' },
  ];

  const createdSlots = [];
  for (const slot of slots) {
    const createdSlot = await prisma.timetableSlot.create({
      data: {
        userId: user.id,
        subjectId: slot.subject.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
      },
    });
    createdSlots.push({ ...createdSlot, subject: slot.subject });
  }

  // Create historical lectures for past 4 weeks (attended vs missed)
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  
  for (let weekOffset = -4; weekOffset <= 1; weekOffset++) {
    for (const slot of createdSlots) {
      const lectureDate = addDays(currentWeekStart, (weekOffset * 7) + (slot.dayOfWeek - 1));
      
      // Determine past vs future status
      let status = 'SCHEDULED';
      if (lectureDate < now) {
        // Random deterministic status for demo
        const rand = (lectureDate.getTime() + slot.subject.id.charCodeAt(0)) % 100;
        if (rand < 75) {
          status = 'ATTENDED';
        } else if (rand < 90) {
          status = 'MISSED';
        } else {
          status = 'HOLIDAY';
        }
      }

      await prisma.lectureInstance.create({
        data: {
          userId: user.id,
          subjectId: slot.subject.id,
          timetableSlotId: slot.id,
          date: lectureDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status,
        },
      });
    }
  }

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

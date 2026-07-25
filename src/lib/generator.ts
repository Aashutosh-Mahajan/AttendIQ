import { prisma } from './prisma';
import { addDays, startOfDay, isBefore, isAfter, getDay, format } from 'date-fns';

export async function generateLecturesForUser(userId: string, targetDaysAhead: number = 21) {
  // Find active semester for user
  const activeSemester = await prisma.semester.findFirst({
    where: { userId, isActive: true },
    include: {
      subjects: {
        include: {
          timetableSlots: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!activeSemester) return { generatedCount: 0, message: 'No active semester found.' };

  const today = startOfDay(new Date());
  const semStart = startOfDay(new Date(activeSemester.startDate));
  const semEnd = startOfDay(new Date(activeSemester.endDate));

  // Determine date window start and end
  let startDate = today < semStart ? semStart : today;
  let endDate = addDays(today, targetDaysAhead);
  if (endDate > semEnd) {
    endDate = semEnd;
  }

  if (startDate > endDate) {
    return { generatedCount: 0, message: 'Current date is outside active semester range.' };
  }

  let generatedCount = 0;

  // Flatten active slots
  const allSlots = activeSemester.subjects.flatMap(subject =>
    subject.timetableSlots.map(slot => ({
      ...slot,
      subjectId: subject.id,
      color: subject.color
    }))
  );

  if (allSlots.length === 0) {
    return { generatedCount: 0, message: 'No active timetable slots found.' };
  }

  // Iterate date by date
  let currDate = new Date(startDate);
  while (currDate <= endDate) {
    const dayOfWeek = getDay(currDate); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const matchingSlots = allSlots.filter(s => s.dayOfWeek === dayOfWeek);

    for (const slot of matchingSlots) {
      const dateOnly = startOfDay(currDate);

      // Check if instance already exists
      const existing = await prisma.lectureInstance.findFirst({
        where: {
          subjectId: slot.subjectId,
          date: dateOnly,
          startTime: slot.startTime,
        }
      });

      if (!existing) {
        await prisma.lectureInstance.create({
          data: {
            userId,
            subjectId: slot.subjectId,
            timetableSlotId: slot.id,
            date: dateOnly,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: 'SCHEDULED'
          }
        });
        generatedCount++;
      }
    }

    currDate = addDays(currDate, 1);
  }

  return {
    generatedCount,
    message: `Auto-generated ${generatedCount} upcoming lectures.`
  };
}

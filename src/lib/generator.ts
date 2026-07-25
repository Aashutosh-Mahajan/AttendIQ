import { prisma } from './prisma';
import { addDays, startOfDay, getDay } from 'date-fns';

/** Creates the lecture instances for every recurring slot through the end of the active term. */
export async function generateLecturesForUser(userId: string) {
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

  const semStart = startOfDay(new Date(activeSemester.startDate));
  const semEnd = startOfDay(new Date(activeSemester.endDate));

  if (semStart > semEnd) {
    return { generatedCount: 0, message: 'The active semester has an invalid date range.' };
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

  // Iterate the full semester so a schedule never has to be entered again each week.
  let currDate = new Date(semStart);
  while (currDate <= semEnd) {
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
    message: `Generated ${generatedCount} lectures for the active semester.`
  };
}

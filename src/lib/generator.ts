import { prisma } from './prisma';

/** Creates the lecture instances for every recurring slot through the end of the active term. */
export async function generateLecturesForUser(userId: string) {
  // Find active semester for user
  const activeSemester = await prisma.semester.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
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

  // Enforce single active semester invariant
  await prisma.semester.updateMany({
    where: {
      userId,
      id: { not: activeSemester.id },
      isActive: true,
    },
    data: { isActive: false },
  });

  const startDateStr = activeSemester.startDate.toISOString().slice(0, 10);
  const endDateStr = activeSemester.endDate.toISOString().slice(0, 10);

  if (startDateStr > endDateStr) {
    return { generatedCount: 0, message: 'The active semester has an invalid date range.' };
  }

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

  let generatedCount = 0;
  const curr = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  while (curr <= end) {
    const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const matchingSlots = allSlots.filter(s => s.dayOfWeek === dayOfWeek);

    for (const slot of matchingSlots) {
      const utcDate = new Date(curr.getTime());

      // Check if instance already exists on this UTC date
      const existing = await prisma.lectureInstance.findFirst({
        where: {
          subjectId: slot.subjectId,
          date: utcDate,
          startTime: slot.startTime,
        }
      });

      if (!existing) {
        await prisma.lectureInstance.create({
          data: {
            userId,
            subjectId: slot.subjectId,
            timetableSlotId: slot.id,
            date: utcDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: 'SCHEDULED'
          }
        });
        generatedCount++;
      }
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return {
    generatedCount,
    message: `Generated ${generatedCount} lectures for the active semester.`
  };
}

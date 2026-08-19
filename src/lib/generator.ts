import { prisma } from './prisma';

/** Creates the lecture instances for every recurring slot through the end of the active term in a single fast batch. */
export async function generateLecturesForUser(userId: string) {
  // Find active semester for user
  const activeSemester = await prisma.semester.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      subjects: {
        select: {
          id: true,
          timetableSlots: {
            where: { isActive: true },
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      },
    },
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
  const allSlots = activeSemester.subjects.flatMap((subject) =>
    subject.timetableSlots.map((slot) => ({
      ...slot,
      subjectId: subject.id,
    }))
  );

  if (allSlots.length === 0) {
    return { generatedCount: 0, message: 'No active timetable slots found.' };
  }

  const recordsToInsert: Array<{
    userId: string;
    subjectId: string;
    timetableSlotId: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
  }> = [];

  const curr = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  while (curr <= end) {
    const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const matchingSlots = allSlots.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const slot of matchingSlots) {
      recordsToInsert.push({
        userId,
        subjectId: slot.subjectId,
        timetableSlotId: slot.id,
        date: new Date(curr.getTime()),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'SCHEDULED',
      });
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  if (recordsToInsert.length === 0) {
    return { generatedCount: 0, message: 'No lectures to generate.' };
  }

  // Single fast batch insert with skipDuplicates
  const result = await prisma.lectureInstance.createMany({
    data: recordsToInsert,
    skipDuplicates: true,
  });

  return {
    generatedCount: result.count,
    message: `Generated ${result.count} new lectures for the active semester.`,
  };
}

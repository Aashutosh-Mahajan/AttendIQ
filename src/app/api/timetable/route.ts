import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLecturesForUser } from '@/lib/generator';
import { startOfDay } from 'date-fns';
import { getUser } from '@/lib/getUser';

function parseDayOfWeek(value: unknown) {
  const dayOfWeek = Number(value);
  return Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : null;
}

function hasValidTimeRange(startTime: unknown, endTime: unknown): startTime is string {
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return typeof startTime === 'string' && typeof endTime === 'string' && timePattern.test(startTime) && timePattern.test(endTime) && startTime < endTime;
}

async function resolveSubject(userId: string, semesterId: string, subjectName?: string, subjectId?: string) {
  if (subjectId) {
    return prisma.subject.findFirst({ where: { id: subjectId, userId, semesterId } });
  }

  const name = subjectName?.trim();
  if (!name) return null;

  const existing = await prisma.subject.findFirst({
    where: { userId, semesterId, name: { equals: name } },
  });
  return existing ?? prisma.subject.create({
    data: { userId, semesterId, name, color: '#6366f1' },
  });
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSemester) return NextResponse.json({ slots: [] });

    const slots = await prisma.timetableSlot.findMany({
      where: {
        userId: user.id,
        subject: { semesterId: activeSemester.id },
      },
      include: {
        subject: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { subjectId, subjectName, dayOfWeek, startTime, endTime, room } = body;

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!activeSemester) return NextResponse.json({ error: 'Create a semester before adding lectures.' }, { status: 400 });
    const parsedDayOfWeek = parseDayOfWeek(dayOfWeek);
    if (parsedDayOfWeek === null) return NextResponse.json({ error: 'Choose a valid day of the week.' }, { status: 400 });
    if (!hasValidTimeRange(startTime, endTime)) return NextResponse.json({ error: 'Choose a valid start and end time.' }, { status: 400 });

    // Only the active term can conflict with a new active-term slot.
    const existingSlots = await prisma.timetableSlot.findMany({
      where: {
        userId: user.id,
        dayOfWeek: parsedDayOfWeek,
        isActive: true,
        subject: { semesterId: activeSemester.id },
      },
    });

    const isOverlap = existingSlots.some((slot) => {
      // Overlap condition: start1 < end2 AND start2 < end1
      return startTime < slot.endTime && slot.startTime < endTime;
    });

    if (isOverlap) {
      return NextResponse.json(
        { error: 'Timetable conflict! Another slot already exists at this day and time.' },
        { status: 400 }
      );
    }

    // Resolve after validation so a rejected request never leaves an orphan subject.
    const subject = await resolveSubject(user.id, activeSemester.id, subjectName, subjectId);
    if (!subject) return NextResponse.json({ error: 'Enter a subject name.' }, { status: 400 });

    const newSlot = await prisma.timetableSlot.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        dayOfWeek: parsedDayOfWeek,
        startTime,
        endTime,
        room,
        isActive: true,
      },
      include: { subject: true },
    });

    // Auto generate lectures after slot creation
    await generateLecturesForUser(user.id);

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, subjectName, dayOfWeek, startTime, endTime, room } = await req.json();
    const parsedDayOfWeek = parseDayOfWeek(dayOfWeek);
    if (!id || !subjectName?.trim() || parsedDayOfWeek === null || !hasValidTimeRange(startTime, endTime)) {
      return NextResponse.json({ error: 'Enter a subject name and a valid time range.' }, { status: 400 });
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!activeSemester) return NextResponse.json({ error: 'No active semester found.' }, { status: 400 });
    const current = await prisma.timetableSlot.findFirst({ where: { id, userId: user.id, subject: { semesterId: activeSemester.id } } });
    if (!current) return NextResponse.json({ error: 'Timetable slot not found.' }, { status: 404 });
    const subject = await resolveSubject(user.id, activeSemester.id, subjectName);
    if (!subject) return NextResponse.json({ error: 'Enter a subject name.' }, { status: 400 });

    const conflicts = await prisma.timetableSlot.findMany({
      where: { userId: user.id, dayOfWeek: parsedDayOfWeek, isActive: true, id: { not: id }, subject: { semesterId: activeSemester.id } },
    });
    if (conflicts.some((slot) => startTime < slot.endTime && slot.startTime < endTime)) {
      return NextResponse.json({ error: 'Timetable conflict! Another lecture already occupies that time.' }, { status: 400 });
    }

    await prisma.lectureInstance.deleteMany({
      where: { timetableSlotId: id, status: 'SCHEDULED', date: { gte: startOfDay(new Date()) } },
    });
    const updated = await prisma.timetableSlot.update({
      where: { id },
      data: { subjectId: subject.id, dayOfWeek: parsedDayOfWeek, startTime, endTime, room: room?.trim() || null, isActive: true },
      include: { subject: true },
    });
    await generateLecturesForUser(user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing slot id' }, { status: 400 });

    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const current = await prisma.timetableSlot.findFirst({ where: { id, userId: user.id } });
    if (!current) return NextResponse.json({ error: 'Timetable slot not found.' }, { status: 404 });

    // Keep completed history but remove scheduled future occurrences.
    await prisma.lectureInstance.deleteMany({
      where: { timetableSlotId: id, userId: user.id, status: 'SCHEDULED', date: { gte: startOfDay(new Date()) } },
    });
    await prisma.timetableSlot.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Slot deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

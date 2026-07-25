import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLecturesForUser } from '@/lib/generator';

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
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
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { subjectId, dayOfWeek, startTime, endTime, room } = body;

    // Check for overlap on the same day for this user
    const existingSlots = await prisma.timetableSlot.findMany({
      where: {
        userId: user.id,
        dayOfWeek: parseInt(dayOfWeek),
        isActive: true,
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

    const newSlot = await prisma.timetableSlot.create({
      data: {
        userId: user.id,
        subjectId,
        dayOfWeek: parseInt(dayOfWeek),
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing slot id' }, { status: 400 });

    // Deactivate slot instead of hard delete to protect historical lecture instances
    await prisma.timetableSlot.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Slot deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

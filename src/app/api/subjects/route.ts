import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttendance } from '@/lib/calculator';

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!activeSemester) {
      return NextResponse.json({ subjects: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id, semesterId: activeSemester.id },
      include: {
        timetableSlots: { where: { isActive: true } },
        lectureInstances: true,
      },
    });

    const enrichedSubjects = subjects.map((subject) => {
      const stats = calculateAttendance(subject.lectureInstances, subject.targetPercentage);
      return {
        ...subject,
        stats,
      };
    });

    return NextResponse.json({ subjects: enrichedSubjects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { name, code, color, targetPercentage, semesterId } = body;

    let targetSemesterId = semesterId;
    if (!targetSemesterId) {
      const activeSem = await prisma.semester.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (!activeSem) return NextResponse.json({ error: 'No active semester found' }, { status: 400 });
      targetSemesterId = activeSem.id;
    }

    const newSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: targetSemesterId,
        name,
        code,
        color: color || '#6366f1',
        targetPercentage: targetPercentage ? parseFloat(targetPercentage) : 75.0,
      },
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, code, color, targetPercentage } = body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(color && { color }),
        ...(targetPercentage !== undefined && { targetPercentage: parseFloat(targetPercentage) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing subject id' }, { status: 400 });

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

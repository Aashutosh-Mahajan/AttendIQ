import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttendance } from '@/lib/calculator';
import { getUser } from '@/lib/getUser';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, code, color, targetPercentage, semesterId } = body;
    const normalizedName = name?.trim();
    const parsedTarget = targetPercentage === undefined ? 75 : Number(targetPercentage);

    if (!normalizedName) {
      return NextResponse.json({ error: 'Subject name is required.' }, { status: 400 });
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 100) {
      return NextResponse.json({ error: 'Target attendance must be between 1% and 100%.' }, { status: 400 });
    }

    let targetSemesterId = semesterId;
    if (!targetSemesterId) {
      const activeSem = await prisma.semester.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (!activeSem) return NextResponse.json({ error: 'No active semester found' }, { status: 400 });
      targetSemesterId = activeSem.id;
    } else {
      const targetSemester = await prisma.semester.findFirst({ where: { id: targetSemesterId, userId: user.id } });
      if (!targetSemester) return NextResponse.json({ error: 'Semester not found.' }, { status: 404 });
    }

    const duplicate = await prisma.subject.findFirst({
      where: { userId: user.id, semesterId: targetSemesterId, name: normalizedName },
    });
    if (duplicate) return NextResponse.json({ error: 'A subject with this name already exists in the active term.' }, { status: 409 });

    const newSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: targetSemesterId,
        name: normalizedName,
        code: code?.trim() || null,
        color: color || '#6366f1',
        targetPercentage: parsedTarget,
      },
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { id, name, code, color, targetPercentage } = body;

    if (!id) return NextResponse.json({ error: 'Missing subject id.' }, { status: 400 });
    if (targetPercentage !== undefined && (!Number.isFinite(Number(targetPercentage)) || Number(targetPercentage) < 1 || Number(targetPercentage) > 100)) {
      return NextResponse.json({ error: 'Target attendance must be between 1% and 100%.' }, { status: 400 });
    }

    const updated = await prisma.subject.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(code !== undefined && { code: code?.trim() || null }),
        ...(color && { color }),
        ...(targetPercentage !== undefined && { targetPercentage: Number(targetPercentage) }),
      },
    });
    if (!updated.count) return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing subject id' }, { status: 400 });

    const subject = await prisma.subject.findFirst({ where: { id, userId: user.id } });
    if (!subject) return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    await prisma.$transaction([
      prisma.lectureInstance.deleteMany({ where: { subjectId: id } }),
      prisma.timetableSlot.deleteMany({ where: { subjectId: id } }),
      prisma.subject.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

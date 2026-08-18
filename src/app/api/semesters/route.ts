import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttendance } from '@/lib/calculator';
import { generateLecturesForUser } from '@/lib/generator';
import { getUser } from '@/lib/getUser';

export async function GET() {
  try {
    // For single user demo, get default user
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        subjects: {
          include: {
            timetableSlots: {
              where: { isActive: true },
            },
            lectureInstances: {
              select: { status: true },
            },
          },
        },
      },
    });

    const allSemesters = await prisma.semester.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        subjects: {
          include: {
            lectureInstances: {
              select: { status: true },
            },
          },
        },
      },
    });

    const semesters = allSemesters.map((semester) => {
      const lectures = semester.subjects.flatMap((subject) => subject.lectureInstances);
      const stats = calculateAttendance(lectures);
      return {
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        isActive: semester.isActive,
        subjectCount: semester.subjects.length,
        attendance: {
          percentage: stats.percentage,
          attendedCount: stats.attendedCount,
          countedLectures: stats.countedLectures,
        },
      };
    });

    return NextResponse.json(
      { activeSemester, semesters },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, startDate, endDate, makeActive } = body;

    if (!name?.trim() || !startDate || !endDate) {
      return NextResponse.json({ error: 'Semester name, start date, and end date are required.' }, { status: 400 });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime()) || parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: 'Choose an end date that is after the start date.' }, { status: 400 });
    }

    if (makeActive !== false) {
      await prisma.semester.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
    }

    const newSemester = await prisma.semester.create({
      data: {
        userId: user.id,
        name: name.trim(),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: makeActive !== false,
      },
    });

    return NextResponse.json(newSemester, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, startDate, endDate } = await req.json();
    if (!id || !name?.trim() || !startDate || !endDate) {
      return NextResponse.json({ error: 'Semester name, start date, and end date are required.' }, { status: 400 });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime()) || parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: 'Choose an end date that is after the start date.' }, { status: 400 });
    }

    const existing = await prisma.semester.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Semester not found.' }, { status: 404 });

    await prisma.lectureInstance.deleteMany({
      where: {
        userId: user.id,
        subject: { semesterId: id },
        status: 'SCHEDULED',
        OR: [{ date: { lt: parsedStartDate } }, { date: { gt: parsedEndDate } }],
      },
    });

    const updated = await prisma.semester.update({
      where: { id },
      data: { name: name.trim(), startDate: parsedStartDate, endDate: parsedEndDate },
    });
    if (updated.isActive) await generateLecturesForUser(user.id);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

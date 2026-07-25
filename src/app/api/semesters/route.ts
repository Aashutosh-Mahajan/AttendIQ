import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // For single user demo, get default user
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        subjects: {
          include: {
            timetableSlots: true,
            lectureInstances: true,
          },
        },
      },
    });

    const allSemesters = await prisma.semester.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ activeSemester, semesters: allSemesters });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { name, startDate, endDate, makeActive } = body;

    if (makeActive) {
      await prisma.semester.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
    }

    const newSemester = await prisma.semester.create({
      data: {
        userId: user.id,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: makeActive !== undefined ? makeActive : true,
      },
    });

    return NextResponse.json(newSemester, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

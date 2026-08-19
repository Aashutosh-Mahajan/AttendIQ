import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLecturesForUser } from '@/lib/generator';
import { startOfDay, endOfDay } from 'date-fns';
import { getUser } from '@/lib/getUser';

const ATTENDANCE_STATUSES = ['ATTENDED', 'MISSED', 'HOLIDAY', 'SCHEDULED'];

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!activeSemester) {
      return NextResponse.json({ lectures: [] });
    }

    let whereClause: any = {
      userId: user.id,
      subject: { semesterId: activeSemester.id },
    };

    if (Boolean(startStr) !== Boolean(endStr)) {
      return NextResponse.json({ error: 'Provide both startDate and endDate.' }, { status: 400 });
    }

    if (startStr && endStr) {
      const startClean = startStr.slice(0, 10);
      const endClean = endStr.slice(0, 10);
      const startDate = new Date(`${startClean}T00:00:00.000Z`);
      const endDate = new Date(`${endClean}T23:59:59.999Z`);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
        return NextResponse.json({ error: 'Choose a valid date range.' }, { status: 400 });
      }
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    let lectures = await prisma.lectureInstance.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            targetPercentage: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // If no lectures exist for this query, verify if generation is needed
    if (lectures.length === 0) {
      const activeSlotCount = await prisma.timetableSlot.count({
        where: {
          userId: user.id,
          isActive: true,
          subject: { semesterId: activeSemester.id },
        },
      });

      if (activeSlotCount > 0) {
        const existingCount = await prisma.lectureInstance.count({
          where: {
            userId: user.id,
            subject: { semesterId: activeSemester.id },
          },
        });

        if (existingCount === 0) {
          await generateLecturesForUser(user.id);
          lectures = await prisma.lectureInstance.findMany({
            where: whereClause,
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                  targetPercentage: true,
                },
              },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          });
        }
      }
    }

    return NextResponse.json(
      { lectures },
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

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !ATTENDANCE_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Choose a valid lecture status.' }, { status: 400 });
    }

    const updated = await prisma.lectureInstance.updateMany({
      where: { id, userId: user.id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
    });
    if (!updated.count) return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Bulk attendance update for an entire day
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { date, status = 'HOLIDAY' } = body;

    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    if (!ATTENDANCE_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 });
    }

    const cleanDate = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
    const targetDate = new Date(`${cleanDate}T00:00:00.000Z`);
    const targetEnd = new Date(`${cleanDate}T23:59:59.999Z`);
    if (Number.isNaN(targetDate.getTime())) return NextResponse.json({ error: 'Choose a valid date.' }, { status: 400 });

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!activeSemester) return NextResponse.json({ error: 'No active semester found.' }, { status: 400 });

    await prisma.lectureInstance.updateMany({
      where: {
        userId: user.id,
        subject: { semesterId: activeSemester.id },
        date: {
          gte: targetDate,
          lte: targetEnd,
        },
      },
      data: {
        status,
      },
    });

    return NextResponse.json({ success: true, message: `All lectures marked as ${status}.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

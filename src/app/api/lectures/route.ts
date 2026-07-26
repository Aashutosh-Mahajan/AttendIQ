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

    // Auto generate missing lectures up to 21 days ahead
    await generateLecturesForUser(user.id);

    let whereClause: any = { userId: user.id };

    if (Boolean(startStr) !== Boolean(endStr)) {
      return NextResponse.json({ error: 'Provide both startDate and endDate.' }, { status: 400 });
    }

    if (startStr && endStr) {
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
        return NextResponse.json({ error: 'Choose a valid date range.' }, { status: 400 });
      }
      whereClause.date = {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      };
    }

    const lectures = await prisma.lectureInstance.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ lectures });
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

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return NextResponse.json({ error: 'Choose a valid date.' }, { status: 400 });
    const targetDate = startOfDay(parsedDate);
    const targetEnd = endOfDay(new Date(date));

    await prisma.lectureInstance.updateMany({
      where: {
        userId: user.id,
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

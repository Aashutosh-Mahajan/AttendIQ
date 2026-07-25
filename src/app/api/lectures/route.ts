import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLecturesForUser } from '@/lib/generator';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    // Auto generate missing lectures up to 21 days ahead
    await generateLecturesForUser(user.id);

    let whereClause: any = { userId: user.id };

    if (startStr && endStr) {
      whereClause.date = {
        gte: startOfDay(new Date(startStr)),
        lte: endOfDay(new Date(endStr)),
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
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updated = await prisma.lectureInstance.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
      include: { subject: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Bulk Holiday for an entire day
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { date } = body;

    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const targetDate = startOfDay(new Date(date));
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
        status: 'HOLIDAY',
      },
    });

    return NextResponse.json({ success: true, message: 'All lectures marked as Holiday.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

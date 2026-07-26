import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLecturesForUser } from '@/lib/generator';
import { getUser } from '@/lib/getUser';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await generateLecturesForUser(user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Read preferences from localStorage-synced field or return defaults
    return NextResponse.json({
      name: user.name || '',
      email: user.email,
      preferences: JSON.parse((user as any).preferences || '{"reminders":true,"compactView":false}'),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();

    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
      },
    });

    return NextResponse.json({ name: updated.name, email: updated.email });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}

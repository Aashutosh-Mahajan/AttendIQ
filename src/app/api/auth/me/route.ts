import { NextResponse } from 'next/server';
import { getUser } from '@/lib/getUser';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? '',
      email: user.email,
    },
  });
}

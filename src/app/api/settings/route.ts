import { NextResponse } from 'next/server';
import { getUser } from '@/lib/getUser';
import { createSupabaseServerClient } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? '',
      email: user.email,
      preferences: { reminders: true, compactView: false },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({
      data: { name: name?.trim() || undefined },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ name: name?.trim(), email: user.email });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/getUser';
import { createSupabaseServerClient } from '@/lib/auth/server';

/**
 * Change password for the currently authenticated user.
 * Expects { newPassword } in the request body.
 *
 * Note: Supabase Auth does not re-verify the current password on the server
 * when updating via updateUser — the session itself is the proof of identity.
 */
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch {
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}

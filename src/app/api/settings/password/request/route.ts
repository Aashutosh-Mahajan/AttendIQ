import { NextResponse } from 'next/server';
import { getUser } from '@/lib/getUser';
import { createSupabaseServerClient } from '@/lib/auth/server';

/**
 * Triggers a password-reset email for the currently signed-in user.
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ message: 'Reset email sent.' });
  } catch {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

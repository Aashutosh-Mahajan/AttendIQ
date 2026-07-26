/**
 * Server-side helper: returns the authenticated Supabase user from the
 * current session, or null if there is no active session.
 *
 * Use this in Route Handlers instead of accessing the Supabase client directly.
 */
import { createSupabaseServerClient } from '@/lib/auth/server';

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

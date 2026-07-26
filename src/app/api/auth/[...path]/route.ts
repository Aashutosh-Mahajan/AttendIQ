/**
 * This catch-all route is no longer used — Supabase Auth is handled
 * client-side via @supabase/ssr. The /api/auth/callback route below
 * handles the OAuth / magic-link exchange if you add those later.
 *
 * Kept as a stub so any stale bookmarks return a clear error instead of 404.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

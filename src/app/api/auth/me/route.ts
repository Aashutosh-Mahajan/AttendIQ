import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
export async function GET() { const user = await getAuthenticatedUser(); return user ? NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

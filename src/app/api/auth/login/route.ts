import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createSession, hashToken, verifyPassword } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } });
    if (!user || !(await verifyPassword(password || '', user.password))) return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    if (!user.emailVerified) { const code = String(randomInt(100000, 1000000)); await prisma.verificationCode.deleteMany({ where: { userId: user.id } }); await prisma.verificationCode.create({ data: { userId: user.id, codeHash: hashToken(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } }); await sendVerificationCode(user.email, code); return NextResponse.json({ verificationRequired: true, email: user.email }); }
    const session = await createSession(user.id);
    const response = NextResponse.json({ user: { name: user.name, email: user.email } });
    response.cookies.set(process.env.AUTH_COOKIE_NAME || 'attendiq_session', session.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: session.expiresAt, path: '/' });
    return response;
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Unable to sign in.' }, { status: 500 }); }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, hashToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } });
    if (!user || !code) return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });

    const verification = await prisma.verificationCode.findFirst({
      where: { userId: user.id, codeHash: hashToken(String(code)), expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
      prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
    ]);

    // Send Welcome / Account Created Email asynchronously
    sendWelcomeEmail(user.email, user.name || 'Student').catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    const session = await createSession(user.id);
    const response = NextResponse.json({ user: { name: user.name, email: user.email } });
    response.cookies.set(process.env.AUTH_COOKIE_NAME || 'attendiq_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to verify email.' }, { status: 500 });
  }
}

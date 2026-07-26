import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid reset request.' }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: { userId: user.id, codeHash: hashToken(String(code)), expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
      prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
      // Also invalidate all active sessions for security
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    // Optionally auto-login after reset
    const session = await createSession(user.id);
    const response = NextResponse.json({ message: 'Password reset successfully.', user: { name: user.name, email: user.email } });
    response.cookies.set(process.env.AUTH_COOKIE_NAME || 'attendiq_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}

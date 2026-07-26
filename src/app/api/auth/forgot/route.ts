import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth';
import { sendPasswordResetCode } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Don't reveal if the user exists or not for security reasons.
      // Just pretend it succeeded.
      return NextResponse.json({ message: 'If an account exists, a reset code was sent.' });
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.$transaction([
      prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
      prisma.verificationCode.create({
        data: { userId: user.id, codeHash, expiresAt },
      }),
    ]);

    await sendPasswordResetCode(user.email, code);

    return NextResponse.json({ message: 'If an account exists, a reset code was sent.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

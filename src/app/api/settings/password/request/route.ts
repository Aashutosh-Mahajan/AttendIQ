import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, hashToken } from '@/lib/auth';
import { sendPasswordResetCode } from '@/lib/email';
import crypto from 'crypto';

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    return NextResponse.json({ message: 'Code sent to your email.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, hashPassword, hashToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, newPassword } = await req.json();

    if (!code || !newPassword) {
      return NextResponse.json({ error: 'Code and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
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
    ]);

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}

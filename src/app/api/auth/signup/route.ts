import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const normalizedEmail = email?.trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || !password || password.length < 8) return NextResponse.json({ error: 'Enter your name, email, and a password of at least 8 characters.' }, { status: 400 });
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user?.emailVerified) return NextResponse.json({ error: 'An account already exists for this email. Please sign in.' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    user = user ? await prisma.user.update({ where: { id: user.id }, data: { name: name.trim(), password: passwordHash } }) : await prisma.user.create({ data: { name: name.trim(), email: normalizedEmail, password: passwordHash } });
    const code = String(randomInt(100000, 1000000));
    await prisma.verificationCode.deleteMany({ where: { userId: user.id } });
    await prisma.verificationCode.create({ data: { userId: user.id, codeHash: hashToken(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
    await sendVerificationCode(user.email, code);
    return NextResponse.json({ email: user.email, message: 'Verification code sent.' });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Unable to create account.' }, { status: 500 }); }
}

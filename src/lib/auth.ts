import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'attendiq_session';

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, savedHash] = stored.split(':');
  if (!salt || !savedHash) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(hash, Buffer.from(savedHash, 'hex'));
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  return { token, expiresAt };
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date) {
  const nextResponse = response as Response & { cookies?: { set: Function } };
  // NextResponse exposes cookies at runtime; this keeps the helper usable from route handlers.
  nextResponse.cookies?.set?.(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: expiresAt, path: '/' });
}

export async function getAuthenticatedUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findFirst({ where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() }, user: { emailVerified: { not: null } } }, include: { user: true } });
  return session?.user ?? null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE_NAME);
}

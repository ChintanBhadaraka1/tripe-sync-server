import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../utils/prisma.js';
import { createError } from '../../middleware/errorHandler.js';

const SALT_ROUNDS = 12;

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

async function storeRefreshToken(userId, rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt },
  });

  return rawToken;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function registerUser({ name, email, password, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const rawRefreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, rawRefreshToken);
  const accessToken = signAccessToken(user);

  return { user, accessToken, refreshToken: rawRefreshToken };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError(401, 'Invalid email or password.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError(401, 'Invalid email or password.');

  const rawRefreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, rawRefreshToken);
  const accessToken = signAccessToken(user);

  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

export async function refreshAccessToken(rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hash },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!stored) throw createError(401, 'Invalid refresh token.');
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw createError(401, 'Refresh token expired. Please log in again.');
  }

  const accessToken = signAccessToken(stored.user);
  return { accessToken };
}

export async function logoutUser(rawToken) {
  if (!rawToken) return;
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
}

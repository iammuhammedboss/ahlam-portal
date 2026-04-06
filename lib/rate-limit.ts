import { prisma } from "./db";
import { RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_LOCKOUT_SECONDS } from "./constants";

export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const record = await prisma.rateLimit.findUnique({
    where: { identifier },
  });

  if (!record) {
    return { allowed: true };
  }

  // Check if currently locked
  if (record.lockedUntil && record.lockedUntil > new Date()) {
    const retryAfter = Math.ceil(
      (record.lockedUntil.getTime() - Date.now()) / 1000
    );
    return { allowed: false, retryAfter };
  }

  // If lock has expired, reset
  if (record.lockedUntil && record.lockedUntil <= new Date()) {
    await prisma.rateLimit.update({
      where: { identifier },
      data: { attempts: 0, lockedUntil: null },
    });
    return { allowed: true };
  }

  return { allowed: true };
}

export async function recordFailedAttempt(identifier: string): Promise<{
  locked: boolean;
  retryAfter?: number;
}> {
  const record = await prisma.rateLimit.upsert({
    where: { identifier },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
    },
    create: {
      identifier,
      attempts: 1,
      lastAttempt: new Date(),
    },
  });

  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + RATE_LIMIT_LOCKOUT_SECONDS * 1000
    );
    await prisma.rateLimit.update({
      where: { identifier },
      data: { lockedUntil },
    });
    return { locked: true, retryAfter: RATE_LIMIT_LOCKOUT_SECONDS };
  }

  return { locked: false };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  await prisma.rateLimit
    .delete({ where: { identifier } })
    .catch(() => {});
}

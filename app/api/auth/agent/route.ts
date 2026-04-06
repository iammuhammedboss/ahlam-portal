import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rateLimitId = `agent:${ip}`;

    // Check rate limit
    const { allowed, retryAfter } = await checkRateLimit(rateLimitId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", retryAfter },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Verify credentials
    const validUsername = username === process.env.AGENT_USERNAME;
    const validPassword = await bcrypt.compare(
      password,
      process.env.AGENT_PASSWORD_HASH || ""
    );

    if (!validUsername || !validPassword) {
      const result = await recordFailedAttempt(rateLimitId);
      return NextResponse.json(
        {
          error: "Invalid credentials",
          ...(result.locked && { retryAfter: result.retryAfter }),
        },
        { status: 401 }
      );
    }

    // Success - set session
    await resetRateLimit(rateLimitId);
    const session = await getSession();
    session.role = "agent";
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

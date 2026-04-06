import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  role: "agent" | "customer";
  enquiryId?: number;
  customerPhone?: string;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    password: process.env.SESSION_SECRET!,
    cookieName: "adl_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24, // 24 hours
    },
  });
}

export async function requireAgent(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (session.role !== "agent") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireCustomer(
  enquiryId: number
): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (session.role !== "customer" || session.enquiryId !== enquiryId) {
    throw new Error("Unauthorized");
  }
  return session;
}

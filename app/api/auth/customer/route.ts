import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin } from "@/lib/pin";
import { getSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { phone, pin, enquiryId: inputEnquiryId } = await request.json();

    if (!pin || (!phone && !inputEnquiryId)) {
      return NextResponse.json(
        { error: "Phone number (or Enquiry ID) and PIN are required" },
        { status: 400 }
      );
    }

    const rateLimitId = `customer:${phone || inputEnquiryId}`;

    // Check rate limit
    const { allowed, retryAfter } = await checkRateLimit(rateLimitId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", retryAfter },
        { status: 429 }
      );
    }

    // Find enquiries matching phone or ID
    let enquiries;
    if (inputEnquiryId) {
      enquiries = await prisma.enquiry.findMany({
        where: { id: Number(inputEnquiryId) },
      });
    } else {
      enquiries = await prisma.enquiry.findMany({
        where: { phone: phone.trim() },
      });
    }

    if (enquiries.length === 0) {
      await recordFailedAttempt(rateLimitId);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Try to match PIN against all matching enquiries
    let matchedEnquiry = null;
    for (const enquiry of enquiries) {
      const valid = await verifyPin(pin, enquiry.pinHash);
      if (valid) {
        matchedEnquiry = enquiry;
        break;
      }
    }

    if (!matchedEnquiry) {
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
    session.role = "customer";
    session.enquiryId = matchedEnquiry.id;
    session.customerPhone = matchedEnquiry.phone;
    await session.save();

    return NextResponse.json({
      success: true,
      enquiryId: matchedEnquiry.id,
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

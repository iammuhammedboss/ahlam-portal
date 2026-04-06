import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPinResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { enquiryId, email } = await request.json();

    if (!enquiryId || !email) {
      return NextResponse.json(
        { error: "Enquiry ID and email are required" },
        { status: 400 }
      );
    }

    // Always return same response to prevent enumeration
    const genericResponse = {
      message: "If the details match our records, a reset email has been sent.",
    };

    const enquiry = await prisma.enquiry.findFirst({
      where: {
        id: Number(enquiryId),
        email: email.trim().toLowerCase(),
      },
    });

    if (!enquiry) {
      return NextResponse.json(genericResponse);
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        pinResetToken: token,
        pinResetExpiry: expiry,
      },
    });

    // Send reset email (non-blocking)
    sendPinResetEmail(enquiry.email, enquiry.id, token).catch(console.error);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot PIN error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

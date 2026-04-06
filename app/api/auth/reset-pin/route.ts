import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/pin";

export async function POST(request: NextRequest) {
  try {
    const { token, newPin } = await request.json();

    if (!token || !newPin) {
      return NextResponse.json(
        { error: "Token and new PIN are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.findFirst({
      where: {
        pinResetToken: token,
        pinResetExpiry: { gt: new Date() },
      },
    });

    if (!enquiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const pinHash = await hashPin(newPin);

    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        pinHash,
        pinResetToken: null,
        pinResetExpiry: null,
      },
    });

    return NextResponse.json({
      message: "PIN updated successfully",
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

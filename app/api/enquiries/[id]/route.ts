import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, getSession } from "@/lib/auth";
import { EnquiryStatus } from "@/app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiryId = Number(id);
    const session = await getSession();

    if (session.role === "agent") {
      // Mark as read by agent
      const enquiry = await prisma.enquiry.update({
        where: { id: enquiryId },
        data: { unreadByAgent: false },
      });
      return NextResponse.json(enquiry);
    }

    if (session.role === "customer" && session.enquiryId === enquiryId) {
      const enquiry = await prisma.enquiry.update({
        where: { id: enquiryId },
        data: { unreadByCustomer: false },
      });
      // Don't expose sensitive fields to customer
      const { pinHash, pinResetToken, pinResetExpiry, ...safe } = enquiry;
      return NextResponse.json(safe);
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Failed to fetch enquiry:", error);
    return NextResponse.json(
      { error: "Failed to fetch enquiry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAgent();
    const { id } = await params;
    const { status } = await request.json();

    if (!Object.values(EnquiryStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json(enquiry);
  } catch (error) {
    console.error("Failed to update enquiry:", error);
    return NextResponse.json(
      { error: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}

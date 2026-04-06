import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { saveFile } from "@/lib/upload";
import { emitNewMessage, emitInboxUpdate } from "@/lib/socket-server";
import {
  sendAgentReplyNotification,
  sendInvoiceNotification,
  sendCustomerReplyNotification,
} from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiryId = Number(id);
    const session = await getSession();

    // Auth check
    if (session.role === "customer" && session.enquiryId !== enquiryId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: { enquiryId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiryId = Number(id);
    const session = await getSession();

    // Auth check
    if (session.role === "customer" && session.enquiryId !== enquiryId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const content = (formData.get("content") as string) || "";
    const file = formData.get("file") as File | null;
    const isInvoice = formData.get("isInvoice") === "true";

    const sender = session.role === "agent" ? "AGENT" : "CUSTOMER";

    let message;

    if (file && file.size > 0) {
      const fileData = await saveFile(file, enquiryId);
      const type = isInvoice && sender === "AGENT" ? "INVOICE" : "FILE";

      message = await prisma.message.create({
        data: {
          enquiryId,
          sender,
          type,
          content,
          fileName: fileData.fileName,
          filePath: fileData.filePath,
          fileSize: fileData.fileSize,
          fileMime: fileData.fileMime,
        },
      });
    } else if (content.trim()) {
      message = await prisma.message.create({
        data: {
          enquiryId,
          sender,
          type: "TEXT",
          content: content.trim(),
        },
      });
    } else {
      return NextResponse.json(
        { error: "Message content or file is required" },
        { status: 400 }
      );
    }

    // Update enquiry metadata
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        lastMessageAt: new Date(),
        unreadByAgent: sender === "CUSTOMER",
        unreadByCustomer: sender === "AGENT",
        ...(sender === "CUSTOMER" && { status: "PENDING_CUSTOMER" }),
      },
    });

    // Emit socket events for real-time updates
    emitNewMessage(enquiryId, message);
    emitInboxUpdate(updatedEnquiry);

    // Send email notifications (non-blocking)
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      select: { email: true, fullName: true },
    });

    if (enquiry) {
      if (sender === "AGENT") {
        if (message.type === "INVOICE") {
          sendInvoiceNotification(enquiry.email, enquiryId, message.fileName || "Invoice").catch(console.error);
        } else {
          sendAgentReplyNotification(enquiry.email, enquiryId).catch(console.error);
        }
      } else {
        sendCustomerReplyNotification(enquiryId, enquiry.fullName).catch(console.error);
      }
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

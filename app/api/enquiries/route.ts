import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePin, hashPin } from "@/lib/pin";
import { saveFile } from "@/lib/upload";
import { requireAgent } from "@/lib/auth";
import { EnquiryStatus } from "@/app/generated/prisma/client";
import { sendEnquiryConfirmation, sendNewEnquiryNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    await requireAgent();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as EnquiryStatus | null;
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "date";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { fullName: { contains: search, mode: "insensitive" } },
        { id: Number(search) || undefined },
      ].filter((condition) => {
        // Remove the id condition if search is not a number
        if ("id" in condition && condition.id === undefined) return false;
        return true;
      });
    }

    const orderBy =
      sortBy === "unread"
        ? [{ unreadByAgent: "desc" as const }, { lastMessageAt: "desc" as const }]
        : [{ lastMessageAt: "desc" as const }];

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
          unreadByAgent: true,
          createdAt: true,
          lastMessageAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, type: true },
          },
        },
      }),
      prisma.enquiry.count({ where }),
    ]);

    return NextResponse.json({
      enquiries: enquiries.map((e) => ({
        ...e,
        lastMessage: e.messages[0]?.content?.substring(0, 80) || "",
        lastMessageType: e.messages[0]?.type || "TEXT",
        messages: undefined,
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    // Validate required fields
    if (!fullName || !phone || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Generate and hash PIN
    const pin = generatePin();
    const pinHash = await hashPin(pin);

    // Create enquiry
    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        pinHash,
      },
    });

    // Create the initial message
    await prisma.message.create({
      data: {
        enquiryId: enquiry.id,
        sender: "CUSTOMER",
        type: "TEXT",
        content: message.trim(),
      },
    });

    // Handle file uploads
    const files = formData.getAll("files") as File[];
    for (const file of files) {
      if (file.size === 0) continue;
      try {
        const fileData = await saveFile(file, enquiry.id);
        await prisma.message.create({
          data: {
            enquiryId: enquiry.id,
            sender: "CUSTOMER",
            type: "FILE",
            content: "",
            fileName: fileData.fileName,
            filePath: fileData.filePath,
            fileSize: fileData.fileSize,
            fileMime: fileData.fileMime,
          },
        });
      } catch (err) {
        console.error(`Failed to upload file ${file.name}:`, err);
      }
    }

    // Send emails (non-blocking)
    sendEnquiryConfirmation(enquiry.email, enquiry.id, pin).catch(console.error);
    sendNewEnquiryNotification(enquiry.id, enquiry.fullName).catch(console.error);

    return NextResponse.json({
      enquiryId: enquiry.id,
      pin,
    });
  } catch (error) {
    console.error("Failed to create enquiry:", error);
    return NextResponse.json(
      { error: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}

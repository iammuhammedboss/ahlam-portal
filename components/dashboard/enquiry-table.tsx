"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

interface Enquiry {
  id: number;
  fullName: string;
  phone: string;
  status: string;
  unreadByAgent: boolean;
  lastMessageAt: string;
  lastMessage: string;
  lastMessageType: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "NEW":
      return "default";
    case "QUOTED":
      return "secondary";
    case "PENDING_CUSTOMER":
      return "outline";
    case "CLOSED":
      return "destructive";
    default:
      return "default";
  }
}

export function EnquiryTable({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();

  if (enquiries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No enquiries found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {enquiries.map((enquiry) => (
        <div
          key={enquiry.id}
          onClick={() => router.push(`/dashboard/enquiry/${enquiry.id}`)}
          className={`flex items-center gap-4 p-4 bg-white rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${
            enquiry.unreadByAgent ? "border-l-4 border-l-primary" : ""
          }`}
        >
          {/* Unread indicator */}
          <div className="flex-shrink-0">
            {enquiry.unreadByAgent && (
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${
                  enquiry.unreadByAgent ? "font-bold" : "font-medium"
                }`}
              >
                #{enquiry.id} - {enquiry.fullName}
              </span>
              <Badge variant={statusVariant(enquiry.status) as "default" | "secondary" | "outline" | "destructive"}>
                {STATUS_LABELS[enquiry.status] || enquiry.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enquiry.phone}
            </p>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {enquiry.lastMessageType === "FILE"
                ? "Sent a file"
                : enquiry.lastMessageType === "INVOICE"
                ? "Sent an invoice"
                : enquiry.lastMessage || "No messages yet"}
            </p>
          </div>

          {/* Time */}
          <div className="flex-shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(enquiry.lastMessageAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

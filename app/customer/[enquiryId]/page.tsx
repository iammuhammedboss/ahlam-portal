"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSocket } from "@/lib/use-socket";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: number;
  sender: "AGENT" | "CUSTOMER";
  type: "TEXT" | "FILE" | "INVOICE";
  content: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileMime?: string;
  createdAt: string;
}

interface Enquiry {
  id: number;
  fullName: string;
  status: string;
  createdAt: string;
}

export default function CustomerEnquiryPage() {
  const params = useParams();
  const enquiryId = Number(params.enquiryId);

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time socket connection
  useSocket(enquiryId, (msg) => {
    const newMsg = msg as Message;
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  });

  const fetchData = useCallback(async () => {
    try {
      const [enquiryRes, messagesRes] = await Promise.all([
        fetch(`/api/enquiries/${enquiryId}`),
        fetch(`/api/enquiries/${enquiryId}/messages`),
      ]);
      const enquiryData = await enquiryRes.json();
      const messagesData = await messagesRes.json();
      setEnquiry(enquiryData);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Find latest invoice
  const latestInvoice = [...messages]
    .reverse()
    .find((m) => m.type === "INVOICE");

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    const formData = new FormData();
    if (messageText.trim()) formData.append("content", messageText.trim());
    if (selectedFile) formData.append("file", selectedFile);

    try {
      const res = await fetch(`/api/enquiries/${enquiryId}/messages`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Failed to send message");
        return;
      }

      const data = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      setMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Enquiry header */}
      <div className="px-4 py-2 border-b bg-white flex items-center gap-3">
        <span className="font-medium text-sm">
          Enquiry #{enquiry?.id}
        </span>
        {enquiry?.status && (
          <Badge variant="outline" className="text-xs">
            {STATUS_LABELS[enquiry.status] || enquiry.status}
          </Badge>
        )}
      </div>

      {/* Invoice Banner */}
      {latestInvoice && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Invoice Available
              </p>
              <p className="text-xs text-yellow-600">
                {latestInvoice.fileName}
              </p>
            </div>
          </div>
          <a
            href={latestInvoice.filePath!}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="border-yellow-400">
              Download
            </Button>
          </a>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "CUSTOMER" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.sender === "CUSTOMER"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              } ${msg.type === "INVOICE" ? "border-2 border-yellow-400" : ""}`}
            >
              {msg.type === "INVOICE" && (
                <Badge className="mb-1 bg-yellow-500 text-white text-[10px]">
                  INVOICE
                </Badge>
              )}
              {msg.content && <p className="text-sm">{msg.content}</p>}
              {msg.filePath && (
                <a
                  href={msg.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs underline block mt-1 ${
                    msg.sender === "CUSTOMER"
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.fileName || "Download file"}{" "}
                  {msg.fileSize &&
                    `(${(msg.fileSize / 1024 / 1024).toFixed(1)} MB)`}
                </a>
              )}
              <p
                className={`text-[10px] mt-1 ${
                  msg.sender === "CUSTOMER"
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground"
                }`}
              >
                {formatDistanceToNow(new Date(msg.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <Separator />

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white flex flex-col gap-2"
      >
        {selectedFile && (
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-sm">
            <span className="truncate flex-1">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-destructive text-xs"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-muted rounded-md flex-shrink-0"
          >
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" disabled={sending}>
            {sending ? "..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}

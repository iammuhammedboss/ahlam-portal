"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/constants";
import { useSocket } from "@/lib/use-socket";
import { formatDistanceToNow, format } from "date-fns";

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
  phone: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function AgentEnquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInvoice, setIsInvoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time socket connection
  useSocket(Number(id), (msg) => {
    const newMsg = msg as Message;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  });

  const fetchData = useCallback(async () => {
    try {
      const [enquiryRes, messagesRes] = await Promise.all([
        fetch(`/api/enquiries/${id}`),
        fetch(`/api/enquiries/${id}/messages`),
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
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    try {
      await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    const formData = new FormData();
    if (messageText.trim()) formData.append("content", messageText.trim());
    if (selectedFile) {
      formData.append("file", selectedFile);
      if (isInvoice) formData.append("isInvoice", "true");
    }

    try {
      const res = await fetch(`/api/enquiries/${id}/messages`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Failed to send message");
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setMessageText("");
      setSelectedFile(null);
      setIsInvoice(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p>Enquiry not found.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Back to Inbox</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <h1 className="text-xl font-bold">Enquiry #{enquiry.id}</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Customer Info Sidebar */}
        <Card className="lg:w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{enquiry.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{enquiry.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium break-all">{enquiry.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {format(new Date(enquiry.createdAt), "PPp")}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <Select value={enquiry.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base">Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "AGENT" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      msg.sender === "AGENT"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } ${msg.type === "INVOICE" ? "border-2 border-yellow-400" : ""}`}
                  >
                    {msg.type === "INVOICE" && (
                      <Badge className="mb-1 bg-yellow-500 text-white">INVOICE</Badge>
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    {msg.filePath && (
                      <a
                        href={msg.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs underline block mt-1 ${
                          msg.sender === "AGENT"
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
                        msg.sender === "AGENT"
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
              className="p-4 flex flex-col gap-2"
            >
              {selectedFile && (
                <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-sm">
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isInvoice}
                      onChange={(e) => setIsInvoice(e.target.checked)}
                      className="rounded"
                    />
                    Invoice
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setIsInvoice(false);
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

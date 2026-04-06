"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

function SuccessContent() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const pin = searchParams.get("pin");

  if (!enquiryId || !pin) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
        <p className="text-muted-foreground mb-4">
          This page requires valid enquiry details.
        </p>
        <Link href="/enquiry/new">
          <Button>Submit New Enquiry</Button>
        </Link>
      </div>
    );
  }

  function copyPin() {
    navigator.clipboard.writeText(pin!);
    toast.success("PIN copied to clipboard");
  }

  return (
    <Card className="max-w-md w-full shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Enquiry Submitted!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div>
          <p className="text-muted-foreground text-sm">Your Enquiry ID</p>
          <p className="text-4xl font-bold text-primary mt-1">#{enquiryId}</p>
        </div>

        <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
          <p className="text-sm text-muted-foreground mb-3">Your Unique PIN</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-5xl font-bold tracking-[0.4em] text-foreground">{pin}</p>
            <button
              onClick={copyPin}
              className="p-2.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border"
              title="Copy PIN"
            >
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">
            Please save this PIN. You will need it to log back in and track your enquiry.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your email address.
        </p>

        <Link href="/login/customer">
          <Button className="w-full h-12 text-base font-semibold" size="lg">
            Go to Login
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <PageHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}

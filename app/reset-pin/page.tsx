"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function ResetPinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <Card className="max-w-sm w-full">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Invalid reset link.</p>
          <Link href="/forgot-pin">
            <Button variant="outline" className="mt-4">
              Request New Link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPin = formData.get("newPin") as string;
    const confirmPin = formData.get("confirmPin") as string;

    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to reset PIN");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="max-w-sm w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-green-600"
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
          <p className="font-medium">PIN updated successfully!</p>
          <Link href="/login/customer">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="text-center">
        <CardTitle>Reset Your PIN</CardTitle>
        <CardDescription>Enter a new 4-digit PIN</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              name="newPin"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              required
              className="text-center text-lg tracking-[0.3em]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              name="confirmPin"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="Confirm your PIN"
              required
              className="text-center text-lg tracking-[0.3em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update PIN"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPinPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <PageHeader />

      <main className="flex-1 flex items-center justify-center px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPinContent />
        </Suspense>
      </main>
    </div>
  );
}

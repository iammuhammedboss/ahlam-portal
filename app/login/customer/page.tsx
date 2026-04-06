"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    const enquiryId = formData.get("enquiryId") as string;
    const pin = formData.get("pin") as string;

    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || undefined,
          enquiryId: enquiryId || undefined,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.retryAfter) {
          toast.error(
            `Too many attempts. Try again in ${data.retryAfter} seconds.`
          );
        } else {
          toast.error(data.error || "Login failed");
        }
        setIsLoading(false);
        return;
      }

      router.push(`/customer/${data.enquiryId}`);
    } catch {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">Ahlam Dhofar Logistics</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="max-w-sm w-full shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <CardTitle className="text-xl">Track Your Enquiry</CardTitle>
            <CardDescription>
              Enter your details and PIN to view your enquiry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="phone">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="phone">Phone Number</TabsTrigger>
                <TabsTrigger value="enquiry">Enquiry ID</TabsTrigger>
              </TabsList>

              <TabsContent value="phone">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+968 XXXX XXXX"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin-phone">4-Digit PIN</Label>
                    <Input
                      id="pin-phone"
                      name="pin"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      placeholder="- - - -"
                      required
                      className="text-center text-2xl tracking-[0.5em] h-14 font-bold"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="enquiry">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="enquiryId">Enquiry ID</Label>
                    <Input
                      id="enquiryId"
                      name="enquiryId"
                      type="number"
                      placeholder="e.g. 1024"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin-enquiry">4-Digit PIN</Label>
                    <Input
                      id="pin-enquiry"
                      name="pin"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      placeholder="- - - -"
                      required
                      className="text-center text-2xl tracking-[0.5em] h-14 font-bold"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center space-y-2">
              <Link
                href="/forgot-pin"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Forgot your PIN?
              </Link>
              <div>
                <Link
                  href="/enquiry/new"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don&apos;t have an enquiry yet? Submit one
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

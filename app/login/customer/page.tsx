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
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Ahlam Dhofar Logistics
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <CardTitle>Track Your Enquiry</CardTitle>
            <CardDescription>
              Enter your details and PIN to view your enquiry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="phone">
              <TabsList className="grid w-full grid-cols-2">
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
                      placeholder="Enter your PIN"
                      required
                      className="text-center text-lg tracking-[0.3em]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                      placeholder="Enter your PIN"
                      required
                      className="text-center text-lg tracking-[0.3em]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center">
              <Link
                href="/forgot-pin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your PIN?
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">Ahlam Dhofar Logistics</h1>
            <p className="text-sm text-muted-foreground">Enquiry Portal</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">How can we help you?</h2>
            <p className="text-muted-foreground">
              Submit a new logistics enquiry or track an existing one.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* New Enquiry Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Submit New Enquiry</CardTitle>
                <CardDescription>
                  Tell us about your logistics requirements and we will get back to you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/enquiry/new">
                  <Button className="w-full" size="lg">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Track Enquiry Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Track Your Enquiry</CardTitle>
                <CardDescription>
                  Already submitted an enquiry? Log in to view updates and chat with us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login/customer">
                  <Button variant="outline" className="w-full" size="lg">
                    Log In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ahlam Dhofar Logistics</p>
          <Link href="/login/agent" className="hover:text-foreground transition-colors">
            Agent Login
          </Link>
        </div>
      </footer>
    </div>
  );
}

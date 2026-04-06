import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";

export default function NewEnquiryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Ahlam Dhofar Logistics
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="max-w-lg w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Submit a New Enquiry</h2>
            <p className="text-muted-foreground mt-1">
              Fill in your details and we will get back to you as soon as possible.
            </p>
          </div>
          <EnquiryForm />
        </div>
      </main>
    </div>
  );
}

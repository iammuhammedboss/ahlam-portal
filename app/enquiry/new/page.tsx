import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHeader } from "@/components/page-header";

export default function NewEnquiryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <PageHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="max-w-lg w-full">
          <div className="mb-6">
            <Link href="/" className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 mb-4 font-medium">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h2 className="text-2xl sm:text-3xl font-bold">Submit a New Enquiry</h2>
            <p className="text-muted-foreground mt-2">
              Fill in your details and we will get back to you as soon as possible.
            </p>
          </div>
          <EnquiryForm />
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/constants";

export function EnquiryForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateFiles(fileList: FileList): File[] {
    const valid: File[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 15MB limit`);
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not an allowed file type`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      setFiles((prev) => [...prev, ...validFiles]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add files to formData
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Remove the native file input value (we use our own files state)
    formData.delete("file-input");

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!formData.get("fullName")) newErrors.fullName = "Name is required";
    if (!formData.get("phone")) newErrors.phone = "Phone number is required";
    if (!formData.get("email")) newErrors.email = "Email is required";
    if (!formData.get("message")) newErrors.message = "Please describe your requirements";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit enquiry");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(`/success?enquiryId=${data.enquiryId}&pin=${data.pin}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Enquiry Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              required
              className="h-11"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+968 XXXX XXXX"
              required
              className="h-11"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Enquiry Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Enquiry Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Describe your logistics requirements..."
              rows={5}
              required
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Packing lists, ID copies, photos, etc. Max 15MB per file.
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-sm text-muted-foreground">
                Click to upload files
              </p>
              <input
                ref={fileInputRef}
                name="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(",")}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm"
                  >
                    <span className="truncate mr-2">{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Enquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

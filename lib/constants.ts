export const ENQUIRY_STATUSES = {
  NEW: "NEW",
  QUOTED: "QUOTED",
  PENDING_CUSTOMER: "PENDING_CUSTOMER",
  CLOSED: "CLOSED",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  QUOTED: "Quoted",
  PENDING_CUSTOMER: "Pending Customer",
  CLOSED: "Closed",
};

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const RATE_LIMIT_MAX_ATTEMPTS = 5;
export const RATE_LIMIT_LOCKOUT_SECONDS = 30;

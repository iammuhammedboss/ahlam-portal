import fs from "fs/promises";
import path from "path";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "./constants";

export async function saveFile(
  file: File,
  enquiryId: number
): Promise<{
  fileName: string;
  filePath: string;
  fileSize: number;
  fileMime: string;
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 15MB limit");
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("File type not allowed");
  }

  const uploadDir =
    process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  const enquiryDir = path.join(uploadDir, String(enquiryId));
  await fs.mkdir(enquiryDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}-${safeName}`;
  const filePath = path.join(enquiryDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    fileName: file.name,
    filePath: `/uploads/${enquiryId}/${fileName}`,
    fileSize: file.size,
    fileMime: file.type,
  };
}

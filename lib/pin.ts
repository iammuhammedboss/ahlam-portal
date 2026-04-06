import bcrypt from "bcrypt";

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

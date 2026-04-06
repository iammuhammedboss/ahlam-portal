import bcrypt from "bcrypt";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "admin";
  const password = "1234";

  const hash = await bcrypt.hash(password, 10);

  await prisma.agent.upsert({
    where: { username },
    update: { password: hash },
    create: { username, password: hash, name: "Admin" },
  });

  console.log(`Agent created: username="${username}", password="${password}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

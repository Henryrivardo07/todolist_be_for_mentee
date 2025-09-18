require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash("secret123", 10);
  await prisma.user.upsert({
    where: { email: "user@todo.local" },
    update: {},
    create: { name: "Demo User", email: "user@todo.local", password: pass },
  });
  console.log("✅ Seed done");
}

main().finally(() => prisma.$disconnect());

/**
 * Ephemeral GitHub Actions fixture. Refuses to run with a non-local database.
 * Never use this script to create production accounts.
 */
import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  if (process.env.CI !== "true" ||
      !process.env.DATABASE_URL?.includes("@localhost:5432/test") ||
      process.env.ADMIN_EMAIL !== "ci-admin@example.test" ||
      !process.env.ADMIN_PASSWORD) {
    throw new Error("Refusing to seed outside the isolated CI test database");
  }
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: { passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) },
    create: {
      email: process.env.ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      firstName: "Test", lastName: "Administrator",
      role: "admin", isActive: true, isVerified: true,
    },
  });
}

main().finally(() => prisma.$disconnect());

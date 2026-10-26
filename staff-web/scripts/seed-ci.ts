/**
 * Ephemeral GitHub Actions fixture. Refuses to run with a non-local database.
 * Never use this script to create production accounts.
 */
import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

async function main() {
  if (process.env.CI !== "true" ||
      !process.env.DATABASE_URL?.includes("@localhost:5432/test") ||
      process.env.ADMIN_EMAIL !== "ci-admin@example.test" ||
      !process.env.ADMIN_PASSWORD) {
    throw new Error("Refusing to seed outside the isolated CI test database");
  }
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: { passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) },
    create: {
      email: process.env.ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      firstName: "Test", lastName: "Administrator",
      role: "admin", isActive: true, isVerified: true,
    },
  });
  const parentEmail = "ci-parent@example.test";
  const parentPassword = "ci-only-parent-password-not-for-production";
  const parent = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {
      passwordHash: await bcrypt.hash(parentPassword, 12),
      isVerified: false, isActive: true,
    },
    create: {
      email: parentEmail, passwordHash: await bcrypt.hash(parentPassword, 12),
      firstName: "Test", lastName: "Parent", role: "member", isVerified: false, isActive: true,
    },
  });
  const testClass = await prisma.class.create({
    data: {
      name: "CI Test Quran Class", teacherName: "Test Instructor",
      schedule: "Saturday 10:00 AM", dayOfWeek: ["Saturday"],
    },
  });
  await prisma.student.upsert({
    where: { studentId: 991017 },
    update: { classId: testClass.id, parentEmail },
    create: {
      studentId: 991017, firstName: "Test", lastName: "Student",
      parentName: "Test Parent", parentEmail, classId: testClass.id,
    },
  });
  const ciRawToken = "a".repeat(64); // CI-only, never for production or non-local databases
  await prisma.emailVerificationToken.create({
    data: {
      userId: parent.id,
      tokenHash: createHash("sha256").update(ciRawToken).digest("hex"),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  const expenseCategory = await prisma.expenseCategory.upsert({
    where: { name: "CI Utilities" },
    update: { isActive: true },
    create: { name: "CI Utilities", isActive: true },
  });
  await prisma.financialExpense.create({
    data: {
      categoryId: expenseCategory.id,
      amount: 34.25,
      description: "CI only electricity fixture",
      date: new Date(),
    },
  });
  // The administrator exists solely for authenticated test requests.
  if (admin.role !== "admin") throw new Error("CI administrator fixture was not created");

}

main().finally(() => prisma.$disconnect());

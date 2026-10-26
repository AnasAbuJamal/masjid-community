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
  const linkedTeacher = await prisma.user.upsert({
    where: { email: "ci-linked-teacher@example.test" },
    update: { role: "teacher", isActive: true, passwordHash: await bcrypt.hash("ci-only-linked-teacher-password", 12) },
    create: { email: "ci-linked-teacher@example.test", firstName: "Test", lastName: "Instructor", role: "teacher", isActive: true, isVerified: true, passwordHash: await bcrypt.hash("ci-only-linked-teacher-password", 12) },
  });
  await prisma.class.create({ data: { name: "CI Unassigned Same-Name Class", teacherName: "Test Instructor", schedule: "Sunday", dayOfWeek: ["Sunday"] } });
  const testClass = await prisma.class.create({
    data: {
      name: "CI Test Quran Class", teacherName: "Test Instructor", teacherId: linkedTeacher.id,
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
  const opportunity = await prisma.volunteerOpportunity.create({
    data: {
      title: "CI Community Cleanup",
      description: "Isolated volunteer fixture",
      eventDate: new Date(Date.now() + 35 * 86400000),
      spotsTotal: 1, spotsFilled: 0, status: "open",
    },
  });
  for (const index of [1, 2]) {
    await prisma.volunteerApplication.create({
      data: {
        opportunityId: opportunity.id,
        userName: `CI Volunteer ${index}`,
        userEmail: `ci-volunteer-${index}@example.test`,
        status: "pending",
      },
    });
  }
  await prisma.donation.createMany({
    data: [
      {
        stripeSessionId: "ci_donation_named_001", amount: 1250,
        status: "completed", donorName: "CI Verified Donor",
        donorEmail: "ci-named-donor@example.test", isAnonymous: false,
      },
      {
        stripeSessionId: "ci_donation_anonymous_001", amount: 875,
        status: "completed", donorName: "CI Private Donor",
        donorEmail: "ci-secret-donor@example.test", isAnonymous: true,
      },
    ],
  });
  const rentalItem = await prisma.rentalItem.create({
    data: { name: "CI Community Room", category: "room", isAvailable: true, priceHourly: 25 },
  });
  const rentalStart = new Date(Date.now() + 20 * 86400000);
  const rentalEnd = new Date(rentalStart.getTime() + 2 * 60 * 60000);
  for (const index of [1, 2]) {
    await prisma.rentalBooking.create({
      data: {
        itemId: rentalItem.id,
        renterName: `CI Renter ${index}`,
        renterEmail: `ci-renter-${index}@example.test`,
        renterPhone: "555-0100",
        eventName: "Integration Test",
        startDate: rentalStart, endDate: rentalEnd,
        totalPrice: 50, status: "pending",
      },
    });
  }
  // Separate owners verify that notification reads cannot cross account boundaries.
  await prisma.notification.create({
    data: { userId: admin.id, type: "info", title: "CI Admin Notification",
      message: "Administrator-only test message", isRead: false },
  });
  await prisma.notification.create({
    data: { userId: parent.id, type: "info", title: "CI Parent Notification",
      message: "Private parent test message", isRead: false },
  });

  // The administrator exists solely for authenticated test requests.
  if (admin.role !== "admin") throw new Error("CI administrator fixture was not created");

}

main().finally(() => prisma.$disconnect());

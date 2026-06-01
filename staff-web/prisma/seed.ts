import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...\n");

    // ── Admin User ──
    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@almomineen.org";
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || "AdminPass123!";
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            isVerified: true,
            isActive: true,
        },
    });
    console.log(`✅ Admin user: ${admin.email}`);

    // ── Teacher User ──
    const teacher = await prisma.user.upsert({
        where: { email: "teacher@almomineen.org" },
        update: {},
        create: {
            email: "teacher@almomineen.org",
            passwordHash: await bcrypt.hash("Teacher123!", 12),
            firstName: "Ahmed",
            lastName: "Hassan",
            role: "teacher",
            isVerified: true,
            isActive: true,
        },
    });
    console.log(`✅ Teacher user: ${teacher.email}`);

    // ── Prayer Times (today + next 7 days) ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        await prisma.prayerTime.upsert({
            where: { date },
            update: {},
            create: {
                date,
                fajr: "06:10",
                sunrise: "07:17",
                dhuhr: "12:45",
                asr: "15:35",
                maghrib: "18:00",
                isha: "19:20",
                jummah1: date.getDay() === 5 ? "13:00" : null,
                jummah2: date.getDay() === 5 ? "14:00" : null,
            },
        });
    }
    console.log("✅ Prayer times seeded (7 days)");

    // ── Blog Posts ──
    const post1 = await prisma.blogPost.upsert({
        where: { slug: "ramadan-preparation-guide" },
        update: {},
        create: {
            title: "Ramadan Preparation Guide",
            slug: "ramadan-preparation-guide",
            body: "As Ramadan approaches, here are some essential tips and guidelines for our community to prepare spiritually and physically for the blessed month.",
            tags: ["ramadan", "community", "worship"],
            status: "published",
            authorId: admin.id,
        },
    });

    await prisma.blogPost.upsert({
        where: { slug: "youth-program-registration" },
        update: {},
        create: {
            title: "Youth Program Registration Now Open",
            slug: "youth-program-registration",
            body: "We are excited to announce that registration for our youth programs is now open. Programs include Quran memorization, Islamic studies, and leadership development.",
            tags: ["youth", "education", "registration"],
            status: "published",
            authorId: admin.id,
        },
    });

    await prisma.blogPost.upsert({
        where: { slug: "community-iftar-announcement" },
        update: {},
        create: {
            title: "Community Iftar Announcement",
            slug: "community-iftar-announcement",
            body: "Join us for our weekly community iftar every Friday during Ramadan. Please register your attendance so we can prepare accordingly.",
            tags: ["ramadan", "community", "event"],
            status: "draft",
            authorId: admin.id,
        },
    });
    console.log("✅ Blog posts seeded");

    // ── Classes & Students ──
    const quranClass = await prisma.class.create({
        data: {
            name: "Quran Memorization - Level 1",
            teacherName: "Ahmed Hassan",
            schedule: "Mon, Wed, Fri — 4:00 PM",
        },
    });

    const arabicClass = await prisma.class.create({
        data: {
            name: "Arabic Language - Beginners",
            teacherName: "Ahmed Hassan",
            schedule: "Tue, Thu — 5:00 PM",
        },
    });

    const students = [
        { firstName: "Omar", lastName: "Ali", classId: quranClass.id, parentName: "Khalid Ali", parentEmail: "khalid@example.com", totalPoints: 850, attendanceRate: 95, attendanceStatus: "excellent" as const, currentLevel: 3 },
        { firstName: "Fatima", lastName: "Ahmed", classId: quranClass.id, parentName: "Hassan Ahmed", parentEmail: "hassan@example.com", totalPoints: 720, attendanceRate: 88, attendanceStatus: "very_good" as const, currentLevel: 2 },
        { firstName: "Yusuf", lastName: "Ibrahim", classId: quranClass.id, parentName: "Ibrahim Khan", parentEmail: "ibrahim@example.com", totalPoints: 540, attendanceRate: 78, attendanceStatus: "good" as const, currentLevel: 2 },
        { firstName: "Aisha", lastName: "Mohamed", classId: arabicClass.id, parentName: "Mohamed Saleh", parentEmail: "mohamed@example.com", totalPoints: 920, attendanceRate: 97, attendanceStatus: "excellent" as const, currentLevel: 4 },
        { firstName: "Zayd", lastName: "Rahman", classId: arabicClass.id, parentName: "Rahman Malik", parentEmail: "rahman@example.com", totalPoints: 380, attendanceRate: 65, attendanceStatus: "needs_improvement" as const, currentLevel: 1 },
    ];

    for (let i = 0; i < students.length; i++) {
        await prisma.student.upsert({
            where: { studentId: i + 1 },
            update: {},
            create: {
                ...students[i],
                studentId: i + 1,
            },
        });
    }
    console.log("✅ Classes & students seeded");

    // ── Construction Projects ──
    await prisma.constructionProject.createMany({
        data: [
            { title: "Main Prayer Hall Expansion", description: "Expanding the main prayer hall to accommodate 500+ worshippers", progressPercent: 54, isUrgent: false, displayOrder: 1 },
            { title: "Parking Lot Renovation", description: "Repaving and expanding the parking lot with proper lighting", progressPercent: 78, isUrgent: false, displayOrder: 2 },
            { title: "Roof Repair — Urgent", description: "Critical roof repair needed before spring rains", progressPercent: 15, isUrgent: true, displayOrder: 3 },
        ],
    });
    console.log("✅ Construction projects seeded");

    // ── Volunteer Opportunities ──
    const volunteerOpp = await prisma.volunteerOpportunity.create({
        data: {
            title: "Ramadan Iftar Preparation",
            description: "Help prepare and serve iftar meals during Ramadan",
            eventDate: new Date("2026-03-15"),
            spotsTotal: 20,
            spotsFilled: 8,
            status: "open",
        },
    });

    await prisma.volunteerApplication.create({
        data: {
            opportunityId: volunteerOpp.id,
            userName: "Sarah Johnson",
            userEmail: "sarah@example.com",
            skills: "Cooking, Event Planning",
            status: "approved",
        },
    });
    console.log("✅ Volunteers seeded");

    // ── Kiosk Announcements ──
    await prisma.kioskAnnouncement.createMany({
        data: [
            { title: "Ramadan Mubarak!", message: "Wishing our community a blessed Ramadan", type: "ramadan", priority: 10, isActive: true },
            { title: "Youth Registration Open", message: "Register for summer Islamic school programs", type: "general", priority: 5, isActive: true },
            { title: "Construction Update", message: "Main hall expansion at 54% — on schedule!", type: "general", priority: 3, isActive: true },
        ],
    });
    console.log("✅ Kiosk announcements seeded");

    // ── Site Settings ──
    const defaultSettings = {
        masjidName: "Masjid Al-Momineen",
        address: "1234 Peachtree Rd, Atlanta, GA",
        phone: "(404) 555-0000",
        donationPortalUrl: "https://almomineen.org/donate",
        kioskEnabled: "true",
        kioskTheme: "dark",
        emergencyAlertEnabled: "false",
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
        await prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    console.log("✅ Site settings seeded");

    // ── Job Postings ──
    await prisma.jobPosting.create({
        data: {
            title: "Part-Time Electrician",
            company: "Al-Noor Electric",
            contactName: "Hassan Ali",
            contactEmail: "hassan@alnoorelectric.com",
            description: "Looking for a licensed electrician for part-time residential work",
            requirements: ["Licensed Electrician", "3+ years experience", "Own tools"],
            location: "Atlanta, GA",
            locationType: "on_site",
            employmentType: "part_time",
            salaryMin: 25,
            salaryMax: 40,
            salaryPeriod: "hourly",
            category: "Construction & Trades",
            status: "active",
        },
    });
    console.log("✅ Job postings seeded");

    // ── Financial Records ──
    await prisma.financialRecord.createMany({
        data: [
            { month: "Jan", year: 2026, donations: 1250000, expenses: 890000, notes: "Strong start to the year" },
            { month: "Feb", year: 2026, donations: 980000, expenses: 750000, notes: "Pre-Ramadan giving increased" },
        ],
    });

    await prisma.financialSummary.create({
        data: {
            totalSpent: 1640000,
            bankBalance: 2340000,
            totalGoal: 5000000,
            totalRaised: 2230000,
            remainingNeeded: 2770000,
        },
    });
    console.log("✅ Financial records seeded");

    console.log("\n🎉 Database seeded successfully!");
    console.log(`\n📧 Admin login: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

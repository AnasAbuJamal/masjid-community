import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAudit } from "./audit";
import { getClientIp } from "./audit";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }
    interface User {
        role: string;
    }
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;
                const ipAddress = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "unknown";

                const user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                });

                if (!user) {
                    return null;
                }

                if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                    const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
                    throw new Error(`Account locked. Try again in ${remainingMinutes} minutes.`);
                }

                if (!user.isActive) {
                    await logAudit({
                        action: "login_failed",
                        email: email.toLowerCase(),
                        details: "Account is inactive",
                        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                        success: false,
                    });
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);
                
                if (!isValid) {
                    const attempts = user.failedLoginAttempts + 1;
                    const lockoutUntil = attempts >= MAX_LOGIN_ATTEMPTS
                        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
                        : null;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: attempts,
                            lockoutUntil,
                        },
                    });

                    await logAudit({
                        action: "login_failed",
                        email: email.toLowerCase(),
                        userId: user.id,
                        details: `Invalid password. ${MAX_LOGIN_ATTEMPTS - attempts} attempts remaining.`,
                        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                        success: false,
                    });

                    if (lockoutUntil) {
                        throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`);
                    }
                    return null;
                }

                if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lockoutUntil: null,
                        },
                    });
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });

                await logAudit({
                    action: "login",
                    email: user.email,
                    userId: user.id,
                    details: "Successful login",
                    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                    success: true,
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 60,
    },
    secret: process.env.AUTH_SECRET,
};

/**
 * Server-side session helper for API routes and Server Components.
 * Usage: `const session = await auth();`
 */
export async function auth() {
    return getServerSession(authOptions);
}
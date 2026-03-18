import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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



export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                });

                if (!user || !user.isActive) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
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
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
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
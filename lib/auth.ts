import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { users } from "./user/schema"
import { eq } from "drizzle-orm"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcrypt"


export const authConfig = {
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username" },
                password: { label: "Password", type: "password" },
            },
            async authorize({ username, password }) {
                const result = await db.select()
                    .from(users)
                    .where(eq(users.email, username as string));
                if (result.length == 0)
                    return null;

                const user = result[0];

                if (!user.passwordHash) {
                    return null;
                }

                const passwordCorrect = await compare(
                    password as string,
                    user.passwordHash!
                );

                return passwordCorrect ? user : null;
            },
        }),
        Google({
            allowDangerousEmailAccountLinking: true,
        })],
    adapter: DrizzleAdapter(db),
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async session({ session, token }) {
            session.user.id = token.sub!;
            return session;
        }
    }
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
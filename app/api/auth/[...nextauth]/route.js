import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, name: user.fullName, email: user.email }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: create a User row on first login (no password needed -
      // they can add one later via Settings -> "Set a Password").
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          const created = await prisma.user.create({
            data: { email: user.email, fullName: user.name || user.email.split("@")[0] },
          })
          user.id = created.id
        } else {
          user.id = existing.id
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id
      // Lets the Profile page's "Update Profile" call session.update({ name })
      // and have the navbar/dashboard reflect the new name without re-login.
      if (trigger === "update" && session?.name) token.name = session.name
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      if (token?.name) session.user.name = token.name
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Your authentication logic here
        return { id: "1", name: "User", email: credentials.email };
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

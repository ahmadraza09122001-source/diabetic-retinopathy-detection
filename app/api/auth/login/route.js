import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // NextAuth config

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "your_secret_key";  // Use environment variable

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        // Find user in the database
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        // Compare password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });

        return new Response(JSON.stringify({ token, user }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Login failed" }), { status: 500 });
    }
}

// Google Authentication
export async function GET(req) {
    const session = await getServerSession(req, authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    return new Response(JSON.stringify({ user: session.user }), { status: 200 });
}

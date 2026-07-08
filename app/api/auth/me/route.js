import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = "your_secret_key";

export async function GET(req) {
    try {
        const token = req.headers.get("Authorization")?.split(" ")[1];
        if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const decoded = jwt.verify(token, SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, name: true, email: true } });

        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        return new Response(JSON.stringify(user), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 403 });
    }
}

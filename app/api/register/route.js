import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in DB
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });

        return new Response(JSON.stringify(user), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "User creation failed" }), { status: 500 });
    }
}

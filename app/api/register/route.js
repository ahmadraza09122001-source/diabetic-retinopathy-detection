import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req) {
  try {
    const { fullName, email, password } = await req.json()

    if (!fullName || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { fullName, email, passwordHash },
    })

    return Response.json({ id: user.id, fullName: user.fullName, email: user.email }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return Response.json({ error: "User creation failed" }, { status: 500 })
  }
}

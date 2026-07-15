import bcrypt from "bcrypt"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await req.json()

    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: "New password must be at least 6 characters." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Only require the current password if one is already set (i.e. not a
    // Google-only account setting a password for the first time).
    if (user.passwordHash) {
      if (!currentPassword) {
        return Response.json({ error: "Current password is required." }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return Response.json({ error: "Current password is incorrect." }, { status: 400 })
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating password:", error)
    return Response.json({ error: "Failed to update password." }, { status: 500 })
  }
}

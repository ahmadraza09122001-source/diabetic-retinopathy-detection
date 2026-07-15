import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword || newPassword.length < 6) {
      return Response.json(
        { error: "A reset token and a password of at least 6 characters are required." },
        { status: 400 },
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return Response.json({ error: "This reset link is invalid or has expired." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ])

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return Response.json({ error: "Failed to reset password." }, { status: 500 })
  }
}

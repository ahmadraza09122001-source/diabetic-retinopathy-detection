import crypto from "crypto"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email) {
      return Response.json({ error: "Email is required." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success even if the user doesn't exist - don't leak
    // which emails are registered.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

      await resend.emails.send({
        from: "Diabetic Retinopathy Detection <onboarding@resend.dev>",
        to: email,
        subject: "Reset your password",
        html: `
          <p>Someone requested a password reset for your account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a> (expires in 1 hour).</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      })
    }

    return Response.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    })
  } catch (error) {
    console.error("Error requesting password reset:", error)
    return Response.json({ error: "Failed to send reset email." }, { status: 500 })
  }
}

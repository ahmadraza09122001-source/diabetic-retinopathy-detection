import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  return Response.json({ hasPassword: !!user?.passwordHash })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Cascades to Profile, Scan, and PasswordResetToken via the schema's
    // onDelete: Cascade relations - no manual cleanup loop needed.
    await prisma.user.delete({ where: { id: session.user.id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return Response.json({ error: "Failed to delete account." }, { status: 500 })
  }
}

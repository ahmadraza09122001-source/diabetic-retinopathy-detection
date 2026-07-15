import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  return Response.json(profile)
}

export async function PUT(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { fullName, phone, age, gender } = await req.json()

    if (fullName) {
      await prisma.user.update({ where: { id: session.user.id }, data: { fullName } })
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { phone, age: age ? Number(age) : null, gender },
      create: { userId: session.user.id, phone, age: age ? Number(age) : null, gender },
    })

    return Response.json(profile)
  } catch (error) {
    console.error("Error saving profile:", error)
    return Response.json({ error: "Failed to save profile." }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.profile.delete({ where: { userId: session.user.id } })
    return Response.json({ success: true })
  } catch (error) {
    // No profile to delete is not really an error from the caller's perspective
    if (error.code === "P2025") {
      return Response.json({ success: true })
    }
    console.error("Error deleting profile:", error)
    return Response.json({ error: "Failed to delete profile." }, { status: 500 })
  }
}

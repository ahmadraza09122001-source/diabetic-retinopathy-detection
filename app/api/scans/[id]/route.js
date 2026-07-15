import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const scan = await prisma.scan.findUnique({ where: { id: params.id } })
    if (!scan) {
      return Response.json({ error: "Scan not found." }, { status: 404 })
    }
    if (scan.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized to delete this scan." }, { status: 403 })
    }

    await prisma.scan.delete({ where: { id: params.id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting scan:", error)
    return Response.json({ error: "Failed to delete scan." }, { status: 500 })
  }
}

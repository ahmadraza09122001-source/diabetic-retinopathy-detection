import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const scans = await prisma.scan.findMany({
    where: { userId: session.user.id },
    orderBy: { scanDate: "desc" },
  })

  // Shape as { result: { class, confidence } } to match what every component
  // already expects (mirrors the object shape the Flask backend itself returns).
  const shaped = scans.map((scan) => ({
    id: scan.id,
    fileName: scan.fileName,
    fileSize: scan.fileSize,
    imagePreview: scan.imagePreview,
    patientName: scan.patientName,
    patientAge: scan.patientAge,
    date: scan.scanDate,
    result: { class: scan.resultClass, confidence: scan.confidence },
  }))

  return Response.json(shaped)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { patientName, patientAge, fileName, fileSize, imagePreview, result } = body
    const resultClass = result?.class || result?.grade_label

    if (!patientName || !patientAge || !resultClass) {
      return Response.json({ error: "patientName, patientAge, and result are required." }, { status: 400 })
    }

    const scan = await prisma.scan.create({
      data: {
        userId: session.user.id,
        patientName,
        patientAge: String(patientAge),
        fileName: fileName || "Unknown",
        fileSize: fileSize || 0,
        imagePreview: imagePreview || "",
        resultClass,
        confidence: result?.confidence ?? undefined,
      },
    })

    return Response.json(
      {
        id: scan.id,
        fileName: scan.fileName,
        fileSize: scan.fileSize,
        imagePreview: scan.imagePreview,
        patientName: scan.patientName,
        patientAge: scan.patientAge,
        date: scan.scanDate,
        result: { class: scan.resultClass, confidence: scan.confidence },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error saving scan:", error)
    return Response.json({ error: "Failed to save scan." }, { status: 500 })
  }
}

import { saveScan } from "../firebase/firestore"
import { auth } from "../firebase/config"

export async function migrateLocalStorageToFirestore() {
  try {
    // Check if user is logged in
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not logged in. Please log in first.")
    }

    // Get scan history from localStorage
    const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]")

    // Get analytics from localStorage
    const analytics = JSON.parse(localStorage.getItem("scanAnalytics") || "{}")

    // Migrate scan history
    console.log(`Migrating ${scanHistory.length} scans to Firestore...`)

    for (const scan of scanHistory) {
      await saveScan(user.uid, {
        fileName: scan.fileName || "Unknown",
        fileSize: scan.fileSize || 0,
        result: scan.result,
        imagePreview: scan.imagePreview,
        date: scan.date,
      })

      console.log(`Migrated scan: ${scan.fileName}`)
    }

    console.log("Migration completed successfully!")

    return {
      success: true,
      migratedScans: scanHistory.length,
    }
  } catch (error) {
    console.error("Migration error:", error)
    throw error
  }
}

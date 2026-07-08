"use client"

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase" // Import db from unified firebase.js

// ✅ Save a scan document to Firestore
export async function saveScan(userId, scanData) {
  try {
    if (!userId) throw new Error("User ID is required to save scan")

    const dataToSave = {
      userId,
      ...scanData,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const scansCollection = collection(db, "scans")
    const docRef = await addDoc(scansCollection, dataToSave)

    return { id: docRef.id, success: true }
  } catch (error) {
    console.error("Error saving scan:", error)
    throw error
  }
}

// ✅ Get all scans for a specific user
export async function getUserScans(userId) {
  try {
    if (!userId) throw new Error("User ID is required to get scans")

    const scansCollection = collection(db, "scans")
    const q = query(scansCollection, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const scans = []
    querySnapshot.forEach((doc) => {
      scans.push({ id: doc.id, ...doc.data() })
    })

    return scans
  } catch (error) {
    console.error("Error getting user scans:", error)
    throw error
  }
}

// ✅ Delete a specific scan if it belongs to the user
export async function deleteScan(scanId, userId) {
  try {
    if (!scanId || !userId) throw new Error("Scan ID and User ID are required")

    const scanDocRef = doc(db, "scans", scanId)
    const docSnapshot = await getDoc(scanDocRef)

    if (!docSnapshot.exists()) throw new Error("Scan not found.")
    if (docSnapshot.data().userId !== userId)
      throw new Error("Unauthorized to delete this scan.")

    await deleteDoc(scanDocRef)
    return { success: true }
  } catch (error) {
    console.error("Error deleting scan:", error)
    throw error
  }
}

// ✅ Generate analytics summary for a user's scans
export async function getUserAnalytics(userId) {
  try {
    if (!userId) throw new Error("User ID is required")

    const scans = await getUserScans(userId)

    const totalScans = scans.length
    const drGrades = {
      "No DR": 0,
      Mild: 0,
      Moderate: 0,
      Severe: 0,
      "Proliferative DR": 0,
      Unknown: 0,
    }
    const monthlyScans = {}

    scans.forEach((scan) => {
      const grade =
        scan.result?.class || scan.result?.grade_label || "Unknown"
      if (drGrades[grade] !== undefined) {
        drGrades[grade] += 1
      } else {
        drGrades["Unknown"] += 1
      }

      try {
        const date = new Date(scan.date)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const monthYear = `${year}-${month}`
        monthlyScans[monthYear] = (monthlyScans[monthYear] || 0) + 1
      } catch (e) {
        console.error("Invalid scan date for analytics:", scan.id, e)
      }
    })

    return { totalScans, drGrades, monthlyScans }
  } catch (error) {
    console.error("Error generating analytics:", error)
    return {
      totalScans: 0,
      drGrades: {
        "No DR": 0,
        Mild: 0,
        Moderate: 0,
        Severe: 0,
        "Proliferative DR": 0,
        Unknown: 0,
      },
      monthlyScans: {},
    }
  }
}

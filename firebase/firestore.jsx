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
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"

export async function saveScan(userId, scanData) {
  try {
    console.log("saveScan called with userId:", userId)
    console.log("scanData:", scanData)

    if (!userId) {
      throw new Error("User ID is required to save scan")
    }

    if (!db) {
      throw new Error("Firestore database not initialized")
    }

    // Add more detailed data
    const dataToSave = {
      userId: userId,
      ...scanData,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(), // Use server timestamp for better consistency
      updatedAt: serverTimestamp(),
    }

    console.log("Attempting to save to Firestore with data:", dataToSave)

    const scansCollection = collection(db, "scans")
    const docRef = await addDoc(scansCollection, dataToSave)

    console.log("Document written with ID:", docRef.id)
    return { id: docRef.id, success: true }
  } catch (error) {
    console.error("Error saving scan:", error)
    console.error("Error details:", error.code, error.message, error.stack)
    throw error
  }
}

export async function getUserScans(userId) {
  try {
    console.log("getUserScans called with userId:", userId)

    if (!userId) {
      throw new Error("User ID is required to get scans")
    }

    const scansCollection = collection(db, "scans")
    const q = query(scansCollection, where("userId", "==", userId))
    console.log("Query created")

    const querySnapshot = await getDocs(q)
    console.log("Query executed, document count:", querySnapshot.size)

    const scans = []
    querySnapshot.forEach((doc) => {
      console.log("Document data:", doc.data())
      scans.push({ id: doc.id, ...doc.data() })
    })

    console.log("Returning scans:", scans)
    return scans
  } catch (error) {
    console.error("Error getting user scans:", error)
    console.error("Error details:", error.code, error.message)
    throw error
  }
}

export async function deleteScan(scanId, userId) {
  try {
    if (!scanId || !userId) {
      throw new Error("Scan ID and User ID are required to delete scan")
    }

    const scanDocRef = doc(db, "scans", scanId)

    // Verify the user ID before deleting
    const docSnapshot = await getDoc(scanDocRef)
    if (!docSnapshot.exists()) {
      throw new Error("Scan not found.")
    }

    const scanData = docSnapshot.data()
    if (scanData.userId !== userId) {
      throw new Error("Unauthorized to delete this scan.")
    }

    await deleteDoc(scanDocRef)
    console.log("Scan deleted successfully:", scanId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting scan:", error)
    throw error
  }
}

export async function getUserAnalytics(userId) {
  try {
    console.log("getUserAnalytics called with userId:", userId)

    if (!userId) {
      throw new Error("User ID is required to get analytics")
    }

    const scans = await getUserScans(userId)
    console.log("Retrieved scans for analytics:", scans.length)

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
      // Handle DR grades
      const grade = scan.result?.class || scan.result?.grade_label || "Unknown"
      if (drGrades[grade] !== undefined) {
        drGrades[grade] += 1
      } else {
        drGrades["Unknown"] += 1
      }

      // Handle monthly scans
      try {
        const date = new Date(scan.date)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0") // Month is 0-indexed
        const monthYear = `${year}-${month}`
        monthlyScans[monthYear] = (monthlyScans[monthYear] || 0) + 1
      } catch (e) {
        console.error("Error processing date for scan:", scan.id, e)
      }
    })

    const analytics = {
      totalScans,
      drGrades,
      monthlyScans,
      scans,
    }

    console.log("Generated analytics:", analytics)
    return analytics
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

export async function getUserProfile(userId) {
  if (!userId) throw new Error("User ID is required to get profile")

  const profileRef = doc(db, "profiles", userId)
  const snapshot = await getDoc(profileRef)
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveUserProfile(userId, profileData) {
  if (!userId) throw new Error("User ID is required to save profile")

  const profileRef = doc(db, "profiles", userId)
  await setDoc(
    profileRef,
    {
      ...profileData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  return { success: true }
}

export async function deleteUserProfile(userId) {
  if (!userId) throw new Error("User ID is required to delete profile")
  await deleteDoc(doc(db, "profiles", userId))
  return { success: true }
}

// Only succeeds for callers whose own profile has role "doctor" - enforced by
// Firestore security rules, not just this client-side query.
export async function getProfilesByRole(role) {
  const profilesCollection = collection(db, "profiles")
  const q = query(profilesCollection, where("role", "==", role))
  const querySnapshot = await getDocs(q)

  const profiles = []
  querySnapshot.forEach((docSnap) => {
    profiles.push({ id: docSnap.id, ...docSnap.data() })
  })
  return profiles
}

// Deletes every scan document belonging to this user - used when a user
// deletes their account, so no orphaned data is left behind in Firestore.
export async function deleteAllUserScans(userId) {
  if (!userId) throw new Error("User ID is required to delete scans")
  const scans = await getUserScans(userId)
  for (const scan of scans) {
    await deleteScan(scan.id, userId)
  }
  return { success: true, count: scans.length }
}

// One-time migration: copies existing Firebase Auth users + Firestore
// "profiles"/"scans" collections into the new PostgreSQL database.
//
// Prerequisites:
//   1. DATABASE_URL set in .env, pointing at the new Postgres database, with
//      `npx prisma migrate dev` already run against it.
//   2. A Firebase service account key downloaded from Firebase Console ->
//      Project Settings -> Service Accounts -> Generate New Private Key,
//      saved locally (NOT committed to git) and its path set via
//      FIREBASE_SERVICE_ACCOUNT_PATH in .env.
//
// Run with: node scripts/migrate-firebase-to-postgres.js
//
// IMPORTANT LIMITATION: Firebase Auth password hashes cannot be converted to
// bcrypt (Firebase uses a proprietary scrypt variant). Migrated users get a
// User row with passwordHash left null - they must use "Forgot Password" once
// to set a usable password. Their scan history and profile migrate fully.

require("dotenv").config()
const { initializeApp, cert } = require("firebase-admin/app")
const { getAuth } = require("firebase-admin/auth")
const { getFirestore } = require("firebase-admin/firestore")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
let auth, firestore

function initFirebaseAdmin() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!keyPath) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your downloaded service account JSON file path.")
  }
  const serviceAccount = require(require("path").resolve(keyPath))
  initializeApp({ credential: cert(serviceAccount) })
  auth = getAuth()
  firestore = getFirestore()
}

async function migrateUsers() {
  console.log("Fetching Firebase Auth users...")
  const userIdMap = new Map() // firebase uid -> new Postgres user id
  let nextPageToken

  do {
    const result = await auth.listUsers(1000, nextPageToken)
    for (const fbUser of result.users) {
      if (!fbUser.email) {
        console.warn(`Skipping user ${fbUser.uid} - no email on file.`)
        continue
      }

      const existing = await prisma.user.findUnique({ where: { email: fbUser.email } })
      if (existing) {
        userIdMap.set(fbUser.uid, existing.id)
        console.log(`Already migrated: ${fbUser.email}`)
        continue
      }

      const created = await prisma.user.create({
        data: {
          email: fbUser.email,
          fullName: fbUser.displayName || fbUser.email.split("@")[0],
          passwordHash: null, // see limitation note at top of file
        },
      })
      userIdMap.set(fbUser.uid, created.id)
      console.log(`Migrated user: ${fbUser.email}`)
    }
    nextPageToken = result.pageToken
  } while (nextPageToken)

  return userIdMap
}

async function migrateProfiles(userIdMap) {
  console.log("\nFetching Firestore profiles...")
  const snapshot = await firestore.collection("profiles").get()

  for (const doc of snapshot.docs) {
    const firebaseUid = doc.id
    const userId = userIdMap.get(firebaseUid)
    if (!userId) {
      console.warn(`Skipping profile ${firebaseUid} - no matching migrated user.`)
      continue
    }

    const data = doc.data()
    await prisma.profile.upsert({
      where: { userId },
      update: {
        phone: data.phone || null,
        age: data.age ? Number(data.age) : null,
        gender: data.gender || null,
      },
      create: {
        userId,
        phone: data.phone || null,
        age: data.age ? Number(data.age) : null,
        gender: data.gender || null,
      },
    })
    console.log(`Migrated profile for ${firebaseUid}`)
  }
}

async function migrateScans(userIdMap) {
  console.log("\nFetching Firestore scans...")
  const snapshot = await firestore.collection("scans").get()

  let migrated = 0
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const userId = userIdMap.get(data.userId)
    if (!userId) {
      console.warn(`Skipping scan ${doc.id} - no matching migrated user for ${data.userId}.`)
      continue
    }

    const resultClass = data.result?.class || data.result?.grade_label || "Unknown"

    await prisma.scan.create({
      data: {
        userId,
        patientName: data.patientName || "Unknown",
        patientAge: String(data.patientAge || ""),
        fileName: data.fileName || "Unknown",
        fileSize: data.fileSize || 0,
        imagePreview: data.imagePreview || "",
        resultClass,
        confidence: data.result?.confidence ?? undefined,
        scanDate: data.date ? new Date(data.date) : new Date(),
      },
    })
    migrated++
  }
  console.log(`Migrated ${migrated} scans.`)
}

async function main() {
  initFirebaseAdmin()

  const userIdMap = await migrateUsers()
  console.log(`\nMigrated ${userIdMap.size} users.\n`)

  await migrateProfiles(userIdMap)
  await migrateScans(userIdMap)

  console.log("\nDone. Migrated users have no password set - they'll need to use")
  console.log("'Forgot password' once to set one before they can log in with credentials.")
  console.log("Google-linked accounts can sign in with Google immediately, no extra step.")

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})

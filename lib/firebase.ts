import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)

let db: ReturnType<typeof getFirestore>

try {
  // Try to get existing Firestore instance first
  db = getFirestore(app)
} catch (error) {
  // If it doesn't exist, initialize with cache settings (only in browser)
  if (typeof window !== "undefined") {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } else {
    // Server-side: use default initialization
    db = getFirestore(app)
  }
}

export { db }

export const storage = getStorage(app)

let adminApp: ReturnType<typeof initializeApp> | null = null
let adminAuth: ReturnType<typeof getAuth> | null = null

export const getAdminAuth = () => {
  if (typeof window === "undefined") return null

  if (!adminAuth) {
    // Initialize secondary app for admin operations
    const existingAdminApp = getApps().find((app) => app.name === "admin")
    adminApp = existingAdminApp || initializeApp(firebaseConfig, "admin")
    adminAuth = getAuth(adminApp)
  }

  return adminAuth
}

export default app

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyAllTqIWxq0GABzn33wlORMBQ2DxeI-jYc",
  authDomain: "smart-hive-17437.firebaseapp.com",
  databaseURL: "https://smart-hive-17437-default-rtdb.firebaseio.com",
  projectId: "smart-hive-17437",
  storageBucket: "smart-hive-17437.firebasestorage.app",
  messagingSenderId: "753413918895",
  appId: "1:753413918895:web:acb949190cd37ad913445a",
  measurementId: "G-35PSFXWTT6"
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
export const database = getDatabase(app)

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

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "./firebase"
import { setCacheItem, getCacheItem } from "./offline-cache"

// Hive types
export interface Hive {
  id?: string
  userId: string
  userName: string // Added userName field to store the name of the person using the hive
  hiveNumber: string
  location: string
  status: "pending" | "confirmed" | "inactive"
  installationDate: Date
  lastInspection?: Date
  createdAt: Date
  updatedAt: Date
}

// Training types
export interface Training {
  id?: string
  title: string
  description: string
  content: string
  category: string
  videoUrl?: string
  documentUrl?: string
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

// Tip types
export interface Tip {
  id?: string
  title: string
  content: string
  author: string
  createdAt: Date
}

// Notification types
export interface Notification {
  id?: string
  userId: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  createdAt: Date
}

// Marketplace listing types
export interface MarketplaceListing {
  id?: string
  userId: string
  productName: string
  description: string
  price: number
  quantity: number
  unit: string
  imageUrl?: string
  status: "active" | "sold" | "inactive"
  createdAt: Date
  updatedAt: Date
}

// Generic CRUD operations
export async function createDocument<T>(collectionName: string, data: Omit<T, "id">) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

export async function getDocuments<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints)
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[]
}

export async function updateDocument(collectionName: string, docId: string, data: Partial<any>) {
  const docRef = doc(db, collectionName, docId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}

// Hive-specific operations
export async function getUserHives(userId: string): Promise<Hive[]> {
  const cacheKey = `hives_${userId}`

  try {
    const hives = await getDocuments<Hive>("hives", [where("userId", "==", userId)])
    const sortedHives = hives.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
    setCacheItem(cacheKey, sortedHives)
    return sortedHives
  } catch (error) {
    console.error("[v0] Error fetching hives, using cache:", error)
    const cachedHives = getCacheItem<Hive[]>(cacheKey)
    return cachedHives || []
  }
}

export async function getAllHives(): Promise<Hive[]> {
  const cacheKey = "all_hives"

  try {
    const hives = await getDocuments<Hive>("hives", [])
    const sortedHives = hives.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
    setCacheItem(cacheKey, sortedHives)
    return sortedHives
  } catch (error) {
    console.error("[v0] Error fetching all hives, using cache:", error)
    const cachedHives = getCacheItem<Hive[]>(cacheKey)
    return cachedHives || []
  }
}

export async function getPendingHives(): Promise<Hive[]> {
  const cacheKey = "pending_hives"

  try {
    const hives = await getDocuments<Hive>("hives", [where("status", "==", "pending")])
    const sortedHives = hives.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
    setCacheItem(cacheKey, sortedHives)
    return sortedHives
  } catch (error) {
    console.error("[v0] Error fetching pending hives, using cache:", error)
    const cachedHives = getCacheItem<Hive[]>(cacheKey)
    return cachedHives || []
  }
}

// Training-specific operations
export async function getAllTrainings(): Promise<Training[]> {
  const cacheKey = "trainings"

  try {
    const trainings = await getDocuments<Training>("trainings", [orderBy("createdAt", "desc")])
    setCacheItem(cacheKey, trainings)
    return trainings
  } catch (error) {
    console.error("[v0] Error fetching trainings, using cache:", error)
    const cachedTrainings = getCacheItem<Training[]>(cacheKey)
    return cachedTrainings || []
  }
}

// Tip-specific operations
export async function getAllTips(): Promise<Tip[]> {
  const cacheKey = "tips"

  try {
    const tips = await getDocuments<Tip>("tips", [orderBy("createdAt", "desc")])
    setCacheItem(cacheKey, tips)
    return tips
  } catch (error) {
    console.error("[v0] Error fetching tips, using cache:", error)
    const cachedTips = getCacheItem<Tip[]>(cacheKey)
    return cachedTips || []
  }
}

// Notification-specific operations
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const cacheKey = `notifications_${userId}`

  try {
    const notifications = await getDocuments<Notification>("notifications", [where("userId", "==", userId)])
    const sortedNotifications = notifications.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
    setCacheItem(cacheKey, sortedNotifications)
    return sortedNotifications
  } catch (error) {
    console.error("[v0] Error fetching notifications, using cache:", error)
    const cachedNotifications = getCacheItem<Notification[]>(cacheKey)
    return cachedNotifications || []
  }
}

export async function markNotificationAsRead(notificationId: string) {
  await updateDocument("notifications", notificationId, { read: true })
}

// Marketplace-specific operations
export async function getUserListings(userId: string): Promise<MarketplaceListing[]> {
  const listings = await getDocuments<MarketplaceListing>("marketplace", [where("userId", "==", userId)])
  return listings.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
    return dateB.getTime() - dateA.getTime()
  })
}

export async function getActiveListings(): Promise<MarketplaceListing[]> {
  const listings = await getDocuments<MarketplaceListing>("marketplace", [where("status", "==", "active")])
  return listings.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
    return dateB.getTime() - dateA.getTime()
  })
}

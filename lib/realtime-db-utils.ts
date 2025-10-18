import { ref, onValue, off, get } from "firebase/database"
import { database } from "./firebase"

// Interface for the real-time hive data structure
export interface RealtimeHiveData {
  GasLevel: number
  Gas_Unit: string
  Humidity: number
  Humidity_Unit: string
  Temperature: number
  Temperature_Unit: string
  Weight: number
  Weight_Unit: string
}

// Interface for processed hive metrics
export interface HiveMetrics {
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Function to get current hive data once
export async function getCurrentHiveData(): Promise<HiveMetrics | null> {
  try {
    const hiveDataRef = ref(database, "HiveData")
    const snapshot = await get(hiveDataRef)
    
    if (snapshot.exists()) {
      const data: RealtimeHiveData = snapshot.val()
      return {
        temperature: data.Temperature,
        humidity: data.Humidity,
        weight: data.Weight,
        gasLevel: data.GasLevel
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching hive data:", error)
    return null
  }
}

// Function to set up real-time listener for hive data
export function subscribeToHiveData(
  callback: (data: HiveMetrics | null) => void
): () => void {
  const hiveDataRef = ref(database, "HiveData")
  
  const handleDataChange = (snapshot: any) => {
    if (snapshot.exists()) {
      const data: RealtimeHiveData = snapshot.val()
      const processedData: HiveMetrics = {
        temperature: data.Temperature,
        humidity: data.Humidity,
        weight: data.Weight,
        gasLevel: data.GasLevel
      }
      callback(processedData)
    } else {
      callback(null)
    }
  }

  const handleError = (error: any) => {
    console.error("Error in real-time listener:", error)
    callback(null)
  }

  // Set up the listener
  onValue(hiveDataRef, handleDataChange, handleError)

  // Return unsubscribe function
  return () => {
    off(hiveDataRef, "value", handleDataChange)
  }
}

// Function to get status based on metric values
export function getMetricStatus(value: number, type: 'temperature' | 'humidity' | 'weight' | 'gasLevel'): 'optimal' | 'warning' | 'danger' {
  switch (type) {
    case 'temperature':
      if (value >= 32 && value <= 36) return 'optimal'
      if (value >= 30 && value <= 38) return 'warning'
      return 'danger'
    
    case 'humidity':
      if (value >= 50 && value <= 60) return 'optimal'
      if (value >= 45 && value <= 70) return 'warning'
      return 'danger'
    
    case 'weight':
      if (value >= 12 && value <= 20) return 'optimal'
      if (value >= 10 && value <= 22) return 'warning'
      return 'danger'
    
    case 'gasLevel':
      if (value < 200) return 'optimal'
      if (value < 500) return 'warning'
      return 'danger'
    
    default:
      return 'optimal'
  }
}

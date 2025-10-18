import { ref, push, get, query, orderByChild, limitToLast } from "firebase/database"
import { database } from "./firebase"
import type { HiveMetrics } from "./realtime-db-utils"

// Interface for storing historical data points
export interface HistoricalDataPoint {
  timestamp: number
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Interface for chart data points
export interface ChartDataPoint {
  time: string
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Function to store current hive metrics as historical data
export async function storeHistoricalData(metrics: HiveMetrics): Promise<void> {
  try {
    const historicalRef = ref(database, "historicalData")
    const dataPoint: HistoricalDataPoint = {
      timestamp: Date.now(),
      temperature: metrics.temperature,
      humidity: metrics.humidity,
      weight: metrics.weight,
      gasLevel: metrics.gasLevel
    }
    
    await push(historicalRef, dataPoint)
  } catch (error) {
    console.error("Error storing historical data:", error)
  }
}

// Function to get historical data for the last 24 hours
export async function getHistoricalData(): Promise<ChartDataPoint[]> {
  try {
    const historicalRef = ref(database, "historicalData")
    
    // Get all historical data without any queries to avoid index requirements
    const snapshot = await get(historicalRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      
      // Convert to array and sort by timestamp
      const dataPoints: HistoricalDataPoint[] = Object.values(data || {})
      
      if (dataPoints.length === 0) {
        return []
      }
      
      // Sort by timestamp (newest first) and take last 8 points for chart
      const chartData: ChartDataPoint[] = dataPoints
        .sort((a, b) => b.timestamp - a.timestamp) // Sort newest first
        .slice(0, 8) // Take last 8 entries
        .reverse() // Reverse to show oldest to newest
        .map(point => {
          // Ensure timestamp is a valid number
          const timestamp = typeof point.timestamp === 'number' ? point.timestamp : Date.now()
          const date = new Date(timestamp)
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp:', point.timestamp)
            return {
              time: new Date().toLocaleTimeString("en-US", { 
                hour: "2-digit", 
                minute: "2-digit",
                second: "2-digit"
              }),
              temperature: point.temperature || 0,
              humidity: point.humidity || 0,
              weight: Math.abs(point.weight || 0), // Convert negative to positive
              gasLevel: point.gasLevel || 0
            }
          }
          
          return {
            time: date.toLocaleTimeString("en-US", { 
              hour: "2-digit", 
              minute: "2-digit",
              second: "2-digit"
            }),
            temperature: point.temperature || 0,
            humidity: point.humidity || 0,
            weight: Math.abs(point.weight || 0), // Convert negative to positive
            gasLevel: point.gasLevel || 0
          }
        })
      
      return chartData
    }
    
    return []
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return []
  }
}

// Function to generate mock trend data for demonstration
export function generateMockTrendData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000))
    const hour = time.getHours()
    
    // Generate realistic mock data with some variation
    const baseTemp = 34 + Math.sin(hour * Math.PI / 12) * 2
    const baseHumidity = 55 + Math.cos(hour * Math.PI / 12) * 5
    const baseWeight = 16 + Math.sin(hour * Math.PI / 6) * 1
    const baseGas = 50 + Math.random() * 20
    
    data.push({
      time: time.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        second: "2-digit"
      }),
      temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 2).toFixed(2)),
      humidity: parseFloat((baseHumidity + (Math.random() - 0.5) * 4).toFixed(2)),
      weight: parseFloat((baseWeight + (Math.random() - 0.5) * 0.5).toFixed(2)),
      gasLevel: parseFloat((baseGas + (Math.random() - 0.5) * 10).toFixed(2))
    })
  }
  
  return data
}

// Function to generate proper time labels for chart
export function generateTimeLabels(count: number = 8): string[] {
  const labels: string[] = []
  const now = new Date()
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Every hour
    labels.push(time.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    }))
  }
  
  return labels
}

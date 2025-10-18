import { createDocument } from './db-utils'
import type { Notification } from './db-utils'

export interface HiveAlert {
  id: string
  type: 'hive_down' | 'hive_offline' | 'temperature_high' | 'temperature_low' | 'humidity_high' | 'humidity_low' | 'weight_anomaly' | 'gas_detected' | 'temperature_optimal' | 'humidity_optimal' | 'weight_optimal' | 'gas_optimal'
  severity: 'warning' | 'error' | 'critical' | 'success'
  title: string
  message: string
  hiveId?: string
  metricValue?: number
  threshold?: number
  timestamp: Date
}

export class AlertManager {
  private static instance: AlertManager
  private alertHistory: Map<string, Date> = new Map()
  private readonly COOLDOWN_PERIODS = {
    hive_down: 5 * 60 * 1000, // 5 minutes
    hive_offline: 10 * 60 * 1000, // 10 minutes
    temperature_high: 15 * 60 * 1000, // 15 minutes
    temperature_low: 15 * 60 * 1000, // 15 minutes
    humidity_high: 15 * 60 * 1000, // 15 minutes
    humidity_low: 15 * 60 * 1000, // 15 minutes
    weight_anomaly: 30 * 60 * 1000, // 30 minutes
    gas_detected: 2 * 60 * 1000, // 2 minutes
    temperature_optimal: 60 * 60 * 1000, // 1 hour
    humidity_optimal: 60 * 60 * 1000, // 1 hour
    weight_optimal: 2 * 60 * 60 * 1000, // 2 hours
    gas_optimal: 30 * 60 * 1000, // 30 minutes
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  async createHiveAlert(
    userId: string,
    alertType: HiveAlert['type'],
    severity: HiveAlert['severity'],
    title: string,
    message: string,
    hiveId?: string,
    metricValue?: number,
    threshold?: number
  ): Promise<void> {
    const alertKey = `${userId}-${alertType}-${hiveId || 'default'}`
    const now = new Date()
    const lastAlert = this.alertHistory.get(alertKey)
    const cooldownPeriod = this.COOLDOWN_PERIODS[alertType]

    // Check if we're in cooldown period
    if (lastAlert && (now.getTime() - lastAlert.getTime()) < cooldownPeriod) {
      return // Skip creating duplicate alert
    }

    // Create notification
    const notification: Omit<Notification, 'id'> = {
      userId,
      title,
      message,
      type: severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info',
      read: false,
      createdAt: now,
    }

    try {
      await createDocument('notifications', notification)
      this.alertHistory.set(alertKey, now)
      console.log(`Alert created: ${alertType} for user ${userId}`)
    } catch (error) {
      console.error('Error creating hive alert:', error)
    }
  }

  // Hive monitoring alerts
  async createHiveDownAlert(userId: string, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'hive_down',
      'warning',
      '⚠️ Hive Down Alert',
      'Your hive has been offline for over 2 minutes. Please check the connection and power supply.',
      hiveId
    )
  }

  async createHiveOfflineAlert(userId: string, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'hive_offline',
      'critical',
      '🚨 Hive Offline Alert',
      'Your hive has been offline for over 10 minutes. This requires immediate attention.',
      hiveId
    )
  }

  // Temperature alerts
  async createTemperatureHighAlert(userId: string, temperature: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'temperature_high',
      'warning',
      '🌡️ High Temperature Alert',
      `Hive temperature is ${temperature.toFixed(1)}°C, which is above the recommended range (35-37°C).`,
      hiveId,
      temperature,
      37
    )
  }

  async createTemperatureLowAlert(userId: string, temperature: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'temperature_low',
      'warning',
      '🌡️ Low Temperature Alert',
      `Hive temperature is ${temperature.toFixed(1)}°C, which is below the recommended range (35-37°C).`,
      hiveId,
      temperature,
      35
    )
  }

  // Humidity alerts
  async createHumidityHighAlert(userId: string, humidity: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'humidity_high',
      'warning',
      '💧 High Humidity Alert',
      `Hive humidity is ${humidity.toFixed(1)}%, which is above the recommended range (50-70%).`,
      hiveId,
      humidity,
      70
    )
  }

  async createHumidityLowAlert(userId: string, humidity: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'humidity_low',
      'warning',
      '💧 Low Humidity Alert',
      `Hive humidity is ${humidity.toFixed(1)}%, which is below the recommended range (50-70%).`,
      hiveId,
      humidity,
      50
    )
  }

  // Weight anomaly alert
  async createWeightAnomalyAlert(userId: string, weight: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'weight_anomaly',
      'warning',
      '⚖️ Weight Anomaly Alert',
      `Hive weight has changed significantly to ${weight.toFixed(1)}kg. This might indicate swarming or other issues.`,
      hiveId,
      weight
    )
  }

  // Gas detection alert
  async createGasDetectedAlert(userId: string, gasLevel: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'gas_detected',
      'critical',
      '⚠️ Gas Detected Alert',
      `Unusual gas levels detected: ${gasLevel.toFixed(1)}%. This could indicate a problem with the hive.`,
      hiveId,
      gasLevel,
      80
    )
  }

  // Optimal range alerts
  async createTemperatureOptimalAlert(userId: string, temperature: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'temperature_optimal',
      'success',
      '✅ Temperature Optimal',
      `Great! Hive temperature is now ${temperature.toFixed(1)}°C, which is within the optimal range (32-36°C).`,
      hiveId,
      temperature
    )
  }

  async createHumidityOptimalAlert(userId: string, humidity: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'humidity_optimal',
      'success',
      '✅ Humidity Optimal',
      `Excellent! Hive humidity is now ${humidity.toFixed(1)}%, which is within the optimal range (50-60%).`,
      hiveId,
      humidity
    )
  }

  async createWeightOptimalAlert(userId: string, weight: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'weight_optimal',
      'success',
      '✅ Weight Optimal',
      `Perfect! Hive weight is now ${weight.toFixed(1)}kg, which is within the target range (12-20kg).`,
      hiveId,
      weight
    )
  }

  async createGasOptimalAlert(userId: string, gasLevel: number, hiveId?: string): Promise<void> {
    await this.createHiveAlert(
      userId,
      'gas_optimal',
      'success',
      '✅ Gas Level Safe',
      `Good! Gas level is now ${gasLevel.toFixed(1)} ppm, which is within the safe range (<200 ppm).`,
      hiveId,
      gasLevel
    )
  }

  // Clear alert history (useful for testing)
  clearAlertHistory(): void {
    this.alertHistory.clear()
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance()

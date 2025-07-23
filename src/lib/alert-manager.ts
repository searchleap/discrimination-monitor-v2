import { prisma } from './prisma'
import { AlertType, AlertSeverity, AlertStatus, ProviderType } from '@prisma/client'
import * as nodemailer from 'nodemailer'

export interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'discord'
  config: Record<string, any>
  enabled: boolean
}

export interface AlertThreshold {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  value: number
  timeWindow?: number // minutes
}

export interface AlertPayload {
  type: AlertType
  severity: AlertSeverity
  message: string
  details?: Record<string, any>
  source?: string
  triggeredBy?: string
}

export interface NotificationChannel {
  send(payload: AlertPayload, config: Record<string, any>): Promise<boolean>
}

class EmailChannel implements NotificationChannel {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    })
  }

  async send(payload: AlertPayload, config: Record<string, any>): Promise<boolean> {
    try {
      const { to, from = process.env.ALERT_FROM_EMAIL || 'alerts@discrimination-monitor.com' } = config
      
      const mailOptions = {
        from,
        to: Array.isArray(to) ? to.join(',') : to,
        subject: `[${payload.severity}] ${payload.type}: ${payload.message}`,
        html: this.generateEmailTemplate(payload),
        text: this.generateTextMessage(payload)
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email alert failed:', error)
      return false
    }
  }

  private generateEmailTemplate(payload: AlertPayload): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${this.getSeverityColor(payload.severity)}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">${payload.severity} Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h2 style="color: #495057; margin-top: 0;">${payload.type}</h2>
            <p style="font-size: 16px; color: #212529;">${payload.message}</p>
            
            ${payload.details ? `
              <h3 style="color: #495057;">Details</h3>
              <pre style="background: #e9ecef; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(payload.details, null, 2)}</pre>
            ` : ''}
            
            ${payload.source ? `<p><strong>Source:</strong> ${payload.source}</p>` : ''}
          </div>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              Discrimination Monitor v2 - AI Processing Pipeline
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateTextMessage(payload: AlertPayload): string {
    let message = `[${payload.severity}] ${payload.type}: ${payload.message}\n\n`
    
    if (payload.details) {
      message += `Details:\n${JSON.stringify(payload.details, null, 2)}\n\n`
    }
    
    if (payload.source) {
      message += `Source: ${payload.source}\n`
    }
    
    message += `\nTriggered at: ${new Date().toLocaleString()}\n`
    message += `Discrimination Monitor v2 - AI Processing Pipeline`
    
    return message
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'CRITICAL': return '#dc3545'
      case 'HIGH': return '#fd7e14'
      case 'MEDIUM': return '#ffc107'
      case 'LOW': return '#28a745'
      default: return '#6c757d'
    }
  }
}

class WebhookChannel implements NotificationChannel {
  async send(payload: AlertPayload, config: Record<string, any>): Promise<boolean> {
    try {
      const { url, headers = {}, method = 'POST' } = config
      
      const webhookPayload = {
        timestamp: new Date().toISOString(),
        alert: payload,
        source: 'discrimination-monitor-v2'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(webhookPayload)
      })

      return response.ok
    } catch (error) {
      console.error('Webhook alert failed:', error)
      return false
    }
  }
}

class SlackChannel implements NotificationChannel {
  async send(payload: AlertPayload, config: Record<string, any>): Promise<boolean> {
    try {
      const { webhookUrl, channel, username = 'Discrimination Monitor' } = config
      
      const slackPayload = {
        channel,
        username,
        icon_emoji: this.getSeverityEmoji(payload.severity),
        attachments: [{
          color: this.getSeverityColor(payload.severity),
          title: `${payload.severity} Alert: ${payload.type}`,
          text: payload.message,
          fields: [
            ...(payload.source ? [{ title: 'Source', value: payload.source, short: true }] : []),
            { title: 'Triggered', value: new Date().toLocaleString(), short: true }
          ],
          footer: 'Discrimination Monitor v2',
          ts: Math.floor(Date.now() / 1000)
        }]
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      })

      return response.ok
    } catch (error) {
      console.error('Slack alert failed:', error)
      return false
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'CRITICAL': return ':rotating_light:'
      case 'HIGH': return ':warning:'
      case 'MEDIUM': return ':information_source:'
      case 'LOW': return ':white_check_mark:'
      default: return ':question:'
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'CRITICAL': return 'danger'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'good'
      case 'LOW': return 'good'
      default: return '#808080'
    }
  }
}

export class AlertManager {
  private channels: Map<string, NotificationChannel>
  private static instance: AlertManager

  constructor() {
    this.channels = new Map([
      ['email', new EmailChannel()],
      ['webhook', new WebhookChannel()],
      ['slack', new SlackChannel()]
    ])
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  async createAlert(config: {
    name: string
    type: AlertType
    severity: AlertSeverity
    threshold: AlertThreshold
    channels: AlertChannel[]
    escalationDelay?: number
    escalationTo?: AlertChannel[]
    config?: Record<string, any>
  }): Promise<string> {
    try {
      const alert = await prisma.alertConfig.create({
        data: {
          name: config.name,
          type: config.type,
          severity: config.severity,
          threshold: config.threshold as any,
          channels: config.channels as any,
          config: config.config || {},
          escalationDelay: config.escalationDelay,
          escalationTo: (config.escalationTo || []) as any
        }
      })
      
      return alert.id
    } catch (error) {
      console.error('Failed to create alert:', error)
      throw error
    }
  }

  async triggerAlert(payload: AlertPayload): Promise<void> {
    try {
      // Find matching alert configurations
      const alerts = await prisma.alertConfig.findMany({
        where: {
          type: payload.type,
          enabled: true
        }
      })

      for (const alert of alerts) {
        // Check if alert should be suppressed
        if (alert.suppressedUntil && alert.suppressedUntil > new Date()) {
          continue
        }

        // Check threshold conditions
        if (!this.checkThreshold(alert.threshold as unknown as AlertThreshold, payload.details)) {
          continue
        }

        // Create alert history record
        const historyRecord = await prisma.alertHistory.create({
          data: {
            alertConfigId: alert.id,
            severity: payload.severity,
            message: payload.message,
            details: payload.details || {}
          }
        })

        // Send notifications
        const channels = alert.channels as unknown as AlertChannel[]
        await this.sendNotifications(payload, channels)

        // Update last triggered
        await prisma.alertConfig.update({
          where: { id: alert.id },
          data: { lastTriggered: new Date() }
        })

        // Schedule escalation if configured
        if (alert.escalationDelay && alert.escalationTo) {
          setTimeout(async () => {
            await this.handleEscalation(alert.id, historyRecord.id, payload)
          }, alert.escalationDelay * 60 * 1000) // Convert minutes to milliseconds
        }
      }
    } catch (error) {
      console.error('Failed to trigger alert:', error)
    }
  }

  private async sendNotifications(payload: AlertPayload, channels: AlertChannel[]): Promise<void> {
    const promises = channels
      .filter(channel => channel.enabled)
      .map(async channel => {
        const handler = this.channels.get(channel.type)
        if (handler) {
          try {
            const success = await handler.send(payload, channel.config)
            if (!success) {
              console.error(`Failed to send ${channel.type} notification`)
            }
          } catch (error) {
            console.error(`Error sending ${channel.type} notification:`, error)
          }
        }
      })

    await Promise.allSettled(promises)
  }

  private checkThreshold(threshold: AlertThreshold, details?: Record<string, any>): boolean {
    if (!details) return true

    const value = details[threshold.metric]
    if (value === undefined) return false

    switch (threshold.operator) {
      case 'gt': return value > threshold.value
      case 'gte': return value >= threshold.value
      case 'lt': return value < threshold.value
      case 'lte': return value <= threshold.value
      case 'eq': return value === threshold.value
      default: return false
    }
  }

  private async handleEscalation(alertId: string, historyId: string, payload: AlertPayload): Promise<void> {
    try {
      // Check if alert was already acknowledged
      const history = await prisma.alertHistory.findUnique({
        where: { id: historyId }
      })

      if (history?.acknowledgedAt) {
        return // Don't escalate if already acknowledged
      }

      const alert = await prisma.alertConfig.findUnique({
        where: { id: alertId }
      })

      if (alert?.escalationTo) {
        const escalationChannels = alert.escalationTo as unknown as AlertChannel[]
        const escalatedPayload = {
          ...payload,
          message: `ESCALATED: ${payload.message}`,
          severity: 'CRITICAL' as AlertSeverity
        }
        
        await this.sendNotifications(escalatedPayload, escalationChannels)
      }
    } catch (error) {
      console.error('Failed to handle escalation:', error)
    }
  }

  async acknowledgeAlert(historyId: string, acknowledgedBy: string): Promise<void> {
    try {
      await prisma.alertHistory.update({
        where: { id: historyId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy
        }
      })
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
      throw error
    }
  }

  async resolveAlert(historyId: string): Promise<void> {
    try {
      await prisma.alertHistory.update({
        where: { id: historyId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to resolve alert:', error)
      throw error
    }
  }

  async suppressAlert(alertId: string, durationMinutes: number): Promise<void> {
    try {
      const suppressedUntil = new Date(Date.now() + durationMinutes * 60 * 1000)
      await prisma.alertConfig.update({
        where: { id: alertId },
        data: { suppressedUntil }
      })
    } catch (error) {
      console.error('Failed to suppress alert:', error)
      throw error
    }
  }

  async getAlertHistory(limit: number = 50): Promise<any[]> {
    try {
      return await prisma.alertHistory.findMany({
        take: limit,
        orderBy: { triggeredAt: 'desc' },
        include: {
          alertConfig: {
            select: { name: true, type: true }
          }
        }
      })
    } catch (error) {
      console.error('Failed to get alert history:', error)
      throw error
    }
  }

  async testAlert(alertId: string): Promise<boolean> {
    try {
      const alert = await prisma.alertConfig.findUnique({
        where: { id: alertId }
      })

      if (!alert) {
        throw new Error('Alert configuration not found')
      }

      const testPayload: AlertPayload = {
        type: alert.type,
        severity: 'LOW',
        message: `Test alert for configuration: ${alert.name}`,
        details: { test: true, timestamp: new Date().toISOString() },
        source: 'AlertManager.testAlert'
      }

      const channels = alert.channels as unknown as AlertChannel[]
      await this.sendNotifications(testPayload, channels)
      
      return true
    } catch (error) {
      console.error('Failed to test alert:', error)
      return false
    }
  }

  // Built-in alert triggers for common scenarios
  async triggerQueueBacklogAlert(queueDepth: number, threshold: number = 50): Promise<void> {
    if (queueDepth > threshold) {
      await this.triggerAlert({
        type: 'QUEUE_BACKLOG',
        severity: queueDepth > threshold * 2 ? 'CRITICAL' : 'HIGH',
        message: `Queue backlog detected: ${queueDepth} items pending`,
        details: { queueDepth, threshold },
        source: 'AIProcessingWorker'
      })
    }
  }

  async triggerProcessingFailureAlert(errorCount: number, batchSize: number): Promise<void> {
    const errorRate = (errorCount / batchSize) * 100
    
    await this.triggerAlert({
      type: 'PROCESSING_FAILURE',
      severity: errorRate > 50 ? 'CRITICAL' : errorRate > 25 ? 'HIGH' : 'MEDIUM',
      message: `High processing failure rate: ${errorRate.toFixed(1)}%`,
      details: { errorCount, batchSize, errorRate },
      source: 'AIBatchClassifier'
    })
  }

  async triggerSystemHealthAlert(metrics: {
    memoryUsage?: number
    cpuUsage?: number
    errorRate?: number
    responseTime?: number
  }): Promise<void> {
    const issues = []
    let severity: AlertSeverity = 'LOW'

    if (metrics.memoryUsage && metrics.memoryUsage > 90) {
      issues.push(`High memory usage: ${metrics.memoryUsage}%`)
      severity = 'CRITICAL'
    }

    if (metrics.cpuUsage && metrics.cpuUsage > 80) {
      issues.push(`High CPU usage: ${metrics.cpuUsage}%`)
      severity = severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
    }

    if (metrics.errorRate && metrics.errorRate > 10) {
      issues.push(`High error rate: ${metrics.errorRate}%`)
      severity = severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
    }

    if (metrics.responseTime && metrics.responseTime > 5000) {
      issues.push(`High response time: ${metrics.responseTime}ms`)
      severity = severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM'
    }

    if (issues.length > 0) {
      await this.triggerAlert({
        type: 'SYSTEM_HEALTH',
        severity,
        message: `System health alert: ${issues.join(', ')}`,
        details: metrics,
        source: 'SystemMonitor'
      })
    }
  }
}

// Singleton instance
export const alertManager = AlertManager.getInstance()
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0
  return Math.round((successful / total) * 100)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function getLocationColor(location: string): string {
  switch (location.toUpperCase()) {
    case 'MICHIGAN':
      return '#1e40af'
    case 'NATIONAL':
      return '#7c3aed'
    case 'INTERNATIONAL':
      return '#64748b'
    default:
      return '#6b7280'
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return '#ef4444'
    case 'MEDIUM':
      return '#f59e0b'
    case 'LOW':
      return '#10b981'
    default:
      return '#6b7280'
  }
}

export function getDiscriminationTypeColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'RACIAL':
      return '#dc2626'
    case 'RELIGIOUS':
      return '#7c3aed'
    case 'DISABILITY':
      return '#2563eb'
    case 'GENERAL_AI':
      return '#059669'
    case 'MULTIPLE':
      return '#ea580c'
    default:
      return '#6b7280'
  }
}

export function sortByDate(items: any[], field: string, order: 'asc' | 'desc' = 'desc'): any[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[field]).getTime()
    const dateB = new Date(b[field]).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

export function groupByDate(items: any[], field: string): Record<string, any[]> {
  return items.reduce((groups, item) => {
    const date = formatDate(new Date(item[field]))
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, any[]>)
}

export function calculateTrend(current: number, previous: number): {
  value: number
  isPositive: boolean
  percentage: number
} {
  if (previous === 0) {
    return { value: current, isPositive: true, percentage: 100 }
  }
  
  const difference = current - previous
  const percentage = Math.abs((difference / previous) * 100)
  
  return {
    value: difference,
    isPositive: difference >= 0,
    percentage: Math.round(percentage)
  }
}

export function getDateRange(days: number): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return { from, to }
}

export function isWithinDateRange(date: Date, range: { from: Date; to: Date }): boolean {
  return date >= range.from && date <= range.to
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function generateSearchQuery(filters: any): string {
  const queries: string[] = []
  
  if (filters.search) {
    queries.push(filters.search)
  }
  
  if (filters.location?.length) {
    queries.push(`location:${filters.location.join('|')}`)
  }
  
  if (filters.discriminationType?.length) {
    queries.push(`type:${filters.discriminationType.join('|')}`)
  }
  
  if (filters.severity?.length) {
    queries.push(`severity:${filters.severity.join('|')}`)
  }
  
  return queries.join(' ')
}
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus, OrderSource } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol = 'Rs.') {
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

export function formatOrderNumber(n: number) {
  return `BB-${String(n).padStart(4, '0')}`
}

export function getStatusColor(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    pending:          'bg-warn/10 text-warn border-warn/20',
    preparing:        'bg-info/10 text-info border-info/20',
    ready:            'bg-success/10 text-success border-success/20',
    out_for_delivery: 'bg-info/10 text-info border-info/20',
    delivered:        'bg-surface3 text-ink3 border-border',
    cancelled:        'bg-danger/10 text-danger border-danger/20',
  }
  return map[status] ?? 'bg-surface3 text-ink3'
}

export function getSourceColor(source: OrderSource) {
  const map: Record<OrderSource, string> = {
    direct:    'bg-accent/10 text-accent border-accent/20',
    zomato:    'bg-danger/10 text-danger border-danger/20',
    whatsapp:  'bg-success/10 text-success border-success/20',
  }
  return map[source]
}

export function getSourceLabel(source: OrderSource) {
  return { direct: 'Direct', zomato: 'Zomato', whatsapp: 'WhatsApp' }[source]
}

export function getStatusLabel(status: OrderStatus) {
  return {
    pending: 'Pending', preparing: 'Preparing', ready: 'Ready',
    out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
  }[status]
}

export function stockLevel(current: number, reorder: number, max: number) {
  const pct = Math.min(100, (current / Math.max(max, 1)) * 100)
  if (current <= reorder) return { level: 'critical', pct, color: 'bg-danger' }
  if (current <= reorder * 1.5) return { level: 'low', pct, color: 'bg-warn' }
  return { level: 'good', pct, color: 'bg-success' }
}

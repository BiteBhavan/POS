import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus, OrderSource } from '@/types'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatCurrency(amount: number, symbol = 'Rs.') { return `${symbol}${Number(amount).toLocaleString('en-IN')}` }
export function formatOrderNumber(n: number) { return `BB-${String(n).padStart(4,'0')}` }

export function getStatusColor(status: OrderStatus) {
  const m: Record<OrderStatus, string> = {
    pending:          'bg-warn/10 text-warn',
    preparing:        'bg-blue-50 text-blue-700',
    ready:            'bg-green-50 text-green-700',
    out_for_delivery: 'bg-blue-50 text-blue-700',
    delivered:        'bg-gray-100 text-gray-500',
    cancelled:        'bg-danger/10 text-danger',
  }
  return m[status] ?? 'bg-gray-100 text-gray-500'
}

export function getSourceColor(source: OrderSource) {
  const m: Record<OrderSource, string> = {
    direct:   'bg-orange-50 text-accent',
    zomato:   'bg-red-50 text-danger',
    whatsapp: 'bg-green-50 text-success',
  }
  return m[source]
}

export function getSourceLabel(source: OrderSource) { return { direct: 'Direct', zomato: 'Zomato', whatsapp: 'WhatsApp' }[source] }
export function getStatusLabel(status: OrderStatus) {
  return { pending:'Pending', preparing:'Preparing', ready:'Ready', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' }[status]
}
export function stockLevel(current: number, reorder: number, max: number) {
  const pct = Math.min(100,(current/Math.max(max,1))*100)
  if (current <= reorder) return { level:'critical', pct, color:'bg-danger' }
  if (current <= reorder*1.5) return { level:'low', pct, color:'bg-warn' }
  return { level:'good', pct, color:'bg-success' }
}

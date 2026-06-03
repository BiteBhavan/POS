import { cn } from '@/lib/utils'
import type { OrderStatus, OrderSource } from '@/types'
import { getStatusColor, getStatusLabel, getSourceColor, getSourceLabel } from '@/lib/utils'

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', className)}>{children}</span>
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
}

export function SourceBadge({ source }: { source: OrderSource }) {
  const icons = { direct: '🏠', zomato: '🔴', whatsapp: '💬' }
  return <Badge className={getSourceColor(source)}>{icons[source]} {getSourceLabel(source)}</Badge>
}

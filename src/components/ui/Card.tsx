import { cn } from '@/lib/utils'

interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void }

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-lg',
        onClick && 'cursor-pointer hover:border-border2 transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon?: string
  accent?: 'gold' | 'green' | 'red' | 'blue'
}) {
  const colors = {
    gold:  'text-accent',
    green: 'text-success',
    red:   'text-danger',
    blue:  'text-info',
  }
  const iconBgs = {
    gold:  'bg-accent/10',
    green: 'bg-success/10',
    red:   'bg-danger/10',
    blue:  'bg-info/10',
  }
  return (
    <div className="bg-surface border border-border rounded-lg p-4 relative overflow-hidden">
      <div className="text-[10px] text-ink3 uppercase tracking-widest font-semibold mb-2">{label}</div>
      <div className={cn('font-display text-[26px] tracking-tight leading-none', accent ? colors[accent] : 'text-ink')}>{value}</div>
      {sub && <div className="text-[11px] text-ink3 mt-1.5">{sub}</div>}
      {icon && (
        <div className={cn('absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm', accent ? iconBgs[accent] : 'bg-surface3')}>
          {icon}
        </div>
      )}
    </div>
  )
}

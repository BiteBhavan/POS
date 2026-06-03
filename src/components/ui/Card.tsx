import { cn } from '@/lib/utils'

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn('bg-white border border-border rounded-lg shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, accent, topColor }: {
  label: string; value: string; sub?: string; icon?: string
  accent?: 'gold' | 'green' | 'red' | 'blue'; topColor?: string
}) {
  const tc = { gold: 'text-accent', green: 'text-success', red: 'text-danger', blue: 'text-info' }
  const ic = { gold: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success', red: 'bg-danger/10 text-danger', blue: 'bg-info/10 text-info' }
  const top = topColor ?? { gold: '#e8620a', green: '#059669', red: '#dc2626', blue: '#1a3a5c' }[accent ?? 'gold']
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm relative overflow-hidden" style={{ borderTop: `3px solid ${top}` }}>
      <div className="p-4">
        <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-2">{label}</div>
        <div className={cn('text-[26px] font-bold leading-none mb-1', accent ? tc[accent] : 'text-ink')}>{value}</div>
        {sub && <div className="text-[11px] text-ink3">{sub}</div>}
        {icon && <div className={cn('absolute top-3.5 right-3.5 w-9 h-9 rounded-lg flex items-center justify-center text-base', accent ? ic[accent] : 'bg-surface3 text-ink3')}>{icon}</div>}
      </div>
    </div>
  )
}

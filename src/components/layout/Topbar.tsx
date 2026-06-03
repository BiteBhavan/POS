import { ReactNode } from 'react'
import { format } from 'date-fns'

interface TopbarProps { title: string; children?: ReactNode }

export function Topbar({ title, children }: TopbarProps) {
  return (
    <header className="h-13 bg-surface border-b border-border flex items-center px-5 gap-4 flex-shrink-0">
      <div>
        <h1 className="font-display text-[18px] text-ink leading-tight">{title}</h1>
        <p className="text-[11px] text-ink3">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
      </div>
      {children && <div className="ml-auto flex items-center gap-2.5">{children}</div>}
    </header>
  )
}

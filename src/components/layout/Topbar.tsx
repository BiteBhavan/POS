"use client"
import { ReactNode } from 'react'
import { format } from 'date-fns'
import { Menu } from 'lucide-react'
import { useMobileMenu } from './AppLayout'

export function Topbar({ title, children }: { title: string; children?: ReactNode }) {
  const openMenu = useMobileMenu()
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 md:px-6 gap-3 flex-shrink-0 shadow-sm">
      <button onClick={openMenu} className="md:hidden text-ink3 hover:text-ink p-1.5 -ml-1 rounded-md hover:bg-surface3 transition-colors flex-shrink-0">
        <Menu size={20}/>
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-ink leading-tight truncate">{title}</h1>
        <p className="text-[11px] text-ink3 hidden sm:block">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </header>
  )
}

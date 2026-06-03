"use client"
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  if (!open) return null
  const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div className={cn('relative bg-white border border-border rounded-t-2xl sm:rounded-xl w-full shadow-lg animate-fade-in max-h-[90vh] overflow-y-auto', w[size])} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-[15px] text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink3 hover:text-ink p-1 rounded-md hover:bg-surface3 transition-colors"><X size={16}/></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border flex gap-2 justify-end bg-surface2 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}

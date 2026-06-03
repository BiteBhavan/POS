"use client"
import { cn } from '@/lib/utils'

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)} className={cn('relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0', checked ? 'bg-success' : 'bg-border2')}>
        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200', checked ? 'left-[18px]' : 'left-0.5')}/>
      </div>
      {label && <span className="text-[12px] text-ink2 font-medium">{label}</span>}
    </label>
  )
}

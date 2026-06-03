import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[11px] text-ink2 font-semibold uppercase tracking-wider">{label}</label>}
    <input ref={ref} className={cn(
      'w-full bg-white border border-border rounded-md px-3 py-2 text-ink text-[13px] outline-none transition-all',
      'focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-ink4',
      error && 'border-danger', className
    )} {...props}/>
    {error && <span className="text-[11px] text-danger">{error}</span>}
  </div>
))
Input.displayName = 'Input'

export function Select({ label, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11px] text-ink2 font-semibold uppercase tracking-wider">{label}</label>}
      <select className={cn('w-full bg-white border border-border rounded-md px-3 py-2 text-ink text-[13px] outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/10', className)} {...props}>
        {children}
      </select>
    </div>
  )
}

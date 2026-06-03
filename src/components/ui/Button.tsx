import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({ variant = 'ghost', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const v = {
    primary: 'bg-accent text-white hover:bg-accent-light shadow-sm font-semibold border border-accent',
    ghost:   'bg-white text-ink2 border border-border hover:bg-surface3 hover:border-border2',
    outline: 'bg-transparent text-accent border border-accent hover:bg-accent/5',
    danger:  'bg-danger/8 text-danger border border-danger/25 hover:bg-danger hover:text-white hover:border-danger',
    success: 'bg-success/8 text-success border border-success/25 hover:bg-success hover:text-white hover:border-success',
  }
  const s = { sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5', md: 'px-4 py-2 text-[13px] rounded-md gap-2', lg: 'px-5 py-2.5 text-sm rounded-lg gap-2' }
  return (
    <button {...props} disabled={disabled || loading}
      className={cn('inline-flex items-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', v[variant], s[size], className)}>
      {loading ? <Loader2 size={14} className="animate-spin"/> : icon}
      {children}
    </button>
  )
}

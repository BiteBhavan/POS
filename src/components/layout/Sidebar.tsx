"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Plus, ChefHat, ClipboardList, Truck,
  Package, UtensilsCrossed, Receipt, BarChart2, Users, Settings, LogOut, X
} from 'lucide-react'
import type { UserRole } from '@/types'
import Image from 'next/image'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, s: 'OVERVIEW',     roles: ['owner'] as UserRole[] },
  { href: '/new-order',     label: 'New Order',     icon: Plus,            s: 'ORDERS',       roles: ['owner','counter'] as UserRole[] },
  { href: '/order-queue',   label: 'Order Queue',   icon: ChefHat,         s: 'ORDERS',       roles: ['owner','counter','kitchen'] as UserRole[], badge: true },
  { href: '/order-history', label: 'Order History', icon: ClipboardList,   s: 'ORDERS',       roles: ['owner','counter'] as UserRole[] },
  { href: '/delivery',      label: 'Delivery',      icon: Truck,           s: 'ORDERS',       roles: ['owner','delivery'] as UserRole[] },
  { href: '/inventory',     label: 'Inventory',     icon: Package,         s: 'OPERATIONS',   roles: ['owner'] as UserRole[] },
  { href: '/menu',          label: 'Menu',          icon: UtensilsCrossed, s: 'OPERATIONS',   roles: ['owner','counter'] as UserRole[] },
  { href: '/expenses',      label: 'Expenses',      icon: Receipt,         s: 'FINANCE',      roles: ['owner'] as UserRole[] },
  { href: '/reports',       label: 'Reports',       icon: BarChart2,       s: 'FINANCE',      roles: ['owner'] as UserRole[] },
  { href: '/customers',     label: 'Customers',     icon: Users,           s: 'INTELLIGENCE', roles: ['owner'] as UserRole[] },
  { href: '/settings',      label: 'Settings',      icon: Settings,        s: 'SYSTEM',       roles: ['owner'] as UserRole[] },
]

interface Props {
  settings?: { business_name: string; logo_url: string | null }
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ settings, mobileOpen, onClose }: Props) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role ?? 'counter'
  const visible = NAV.filter(n => n.roles.includes(role))
  let lastS = ''

  return (
    <aside className={cn(
      'bg-sidebar flex flex-col flex-shrink-0 h-screen z-50 transition-transform duration-200',
      'fixed top-0 left-0 w-[220px] md:relative md:translate-x-0',
      mobileOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full md:translate-x-0'
    )}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {settings?.logo_url
            ? <Image src={settings.logo_url} alt="Logo" width={30} height={30} className="rounded-lg object-contain" />
            : <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-base flex-shrink-0">🍔</div>
          }
          <div>
            <div className="text-[15px] font-bold text-white leading-tight">{settings?.business_name ?? 'Bite Bhavan'}</div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest">Kitchen POS</div>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-white/50 hover:text-white p-1"><X size={16}/></button>
      </div>

      {/* Role */}
      <div className="mx-3 mt-2.5 mb-1 bg-white/8 rounded-lg px-3 py-2 flex items-center gap-2 border border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>
        <span className="text-[12px] text-white/70 font-medium flex-1 truncate">{user?.name ?? '...'}</span>
        <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded font-bold uppercase">{role}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visible.map(item => {
          const show = item.s !== lastS
          lastS = item.s
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <div key={item.href}>
              {show && <div className="text-[9px] text-white/35 uppercase tracking-[1.4px] font-semibold px-3 pt-3 pb-1">{item.s}</div>}
              <Link href={item.href} onClick={onClose} className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-100 group',
                active
                  ? 'bg-white/12 text-white border-l-[3px] border-accent pl-[9px]'
                  : 'text-white/60 hover:text-white hover:bg-white/7'
              )}>
                <Icon size={14} className="flex-shrink-0"/>
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">4</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        <button onClick={async () => {
          const { createClient } = await import('@/lib/supabase/client')
          await createClient().auth.signOut()
          useAuthStore.getState().setUser(null)
          window.location.href = '/login'
        }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/8 transition-colors text-left group">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
            {user?.name?.slice(0,2).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-white/50 capitalize">{role}</div>
          </div>
          <LogOut size={13} className="text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0"/>
        </button>
      </div>
    </aside>
  )
}

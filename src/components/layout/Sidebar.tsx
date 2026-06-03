"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Plus, ChefHat, ClipboardList, Truck,
  Package, UtensilsCrossed, Receipt, BarChart2, Users, Settings, LogOut
} from 'lucide-react'
import type { UserRole } from '@/types'
import Image from 'next/image'

const ALL_NAV = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, section: 'OVERVIEW',     roles: ['owner'] as UserRole[] },
  { href: '/new-order',     label: 'New Order',      icon: Plus,            section: 'ORDERS',       roles: ['owner','counter'] as UserRole[] },
  { href: '/order-queue',   label: 'Order Queue',    icon: ChefHat,         section: 'ORDERS',       roles: ['owner','counter','kitchen'] as UserRole[], badge: true },
  { href: '/order-history', label: 'Order History',  icon: ClipboardList,   section: 'ORDERS',       roles: ['owner','counter'] as UserRole[] },
  { href: '/delivery',      label: 'Delivery',       icon: Truck,           section: 'ORDERS',       roles: ['owner','delivery'] as UserRole[] },
  { href: '/inventory',     label: 'Inventory',      icon: Package,         section: 'OPERATIONS',   roles: ['owner'] as UserRole[] },
  { href: '/menu',          label: 'Menu',           icon: UtensilsCrossed, section: 'OPERATIONS',   roles: ['owner','counter'] as UserRole[] },
  { href: '/expenses',      label: 'Expenses',       icon: Receipt,         section: 'FINANCE',      roles: ['owner'] as UserRole[] },
  { href: '/reports',       label: 'Reports',        icon: BarChart2,       section: 'FINANCE',      roles: ['owner'] as UserRole[] },
  { href: '/customers',     label: 'Customers',      icon: Users,           section: 'INTELLIGENCE', roles: ['owner'] as UserRole[] },
  { href: '/settings',      label: 'Settings',       icon: Settings,        section: 'SYSTEM',       roles: ['owner'] as UserRole[] },
]

export function Sidebar({ settings }: { settings?: { business_name: string; logo_url: string | null } }) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role ?? 'counter'
  const visibleNav = ALL_NAV.filter(n => n.roles.includes(role))
  let lastSection = ''

  return (
    <aside className="w-[216px] bg-surface border-r border-border flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            <Image src={settings.logo_url} alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-base flex-shrink-0">🍔</div>
          )}
          <div>
            <div className="font-display text-[17px] text-ink leading-tight">
              {settings?.business_name ?? 'Bite Bhavan'}
            </div>
            <div className="text-[10px] text-ink4 uppercase tracking-widest mt-0.5">Kitchen POS</div>
          </div>
        </div>
      </div>

      {/* Role pill */}
      <div className="mx-3 mt-2.5 mb-0.5 bg-surface3 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
        <span className="text-[12px] text-ink2 font-medium capitalize flex-1">{user?.name ?? 'Loading'}</span>
        <span className="text-[9px] bg-accent text-[#1a1400] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{role}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleNav.map(item => {
          const showSection = item.section !== lastSection
          lastSection = item.section
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <div key={item.href}>
              {showSection && (
                <div className="text-[9.5px] text-ink4 uppercase tracking-[1.4px] font-semibold px-4 pt-3 pb-1">
                  {item.section}
                </div>
              )}
              <Link href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-all duration-150 relative',
                  isActive
                    ? 'text-accent-light bg-accent/5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-accent before:rounded-r'
                    : 'text-ink3 hover:text-ink2 hover:bg-surface2'
                )}>
                <Icon size={14} className="flex-shrink-0 opacity-80" />
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <button className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface2 transition-colors text-left">
          <div className="w-7 h-7 rounded-lg bg-surface3 border border-border2 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0">
            {user?.name?.slice(0,2).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-ink truncate">{user?.name}</div>
            <div className="text-[11px] text-ink3 capitalize">{role}</div>
          </div>
          <LogOut size={13} className="text-ink3 flex-shrink-0" />
        </button>
      </div>
    </aside>
  )
}

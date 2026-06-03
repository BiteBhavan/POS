import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatOrderNumber } from '@/lib/utils'
import { startOfDay, endOfDay, format } from 'date-fns'
import Link from 'next/link'
import type { Order, InventoryItem } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const today = new Date()

  const [ordersRes, lowStockRes, settingsRes] = await Promise.all([
    supabase.from('orders')
      .select('*, order_items(*)')
      .gte('created_at', startOfDay(today).toISOString())
      .lte('created_at', endOfDay(today).toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('inventory_items')
      .select('*, category:inventory_categories(name)')
      .filter('current_stock', 'lte', 'reorder_level') // approximate
      .eq('is_active', true),
    supabase.from('app_settings').select('zomato_commission_pct, currency_symbol').single(),
  ])

  const orders: Order[] = ordersRes.data ?? []
  const lowStockItems: InventoryItem[] = (lowStockRes.data ?? []).filter(
    (i: InventoryItem) => i.current_stock <= i.reorder_level
  )
  const settings = settingsRes.data
  const sym = settings?.currency_symbol ?? 'Rs.'
  const commPct = settings?.zomato_commission_pct ?? 31

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const directOrders = orders.filter(o => o.source === 'direct')
  const zomatoOrders = orders.filter(o => o.source === 'zomato')
  const zomatoRevenue = zomatoOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const zomatoCommission = (zomatoRevenue * commPct) / 100
  const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0
  const activeOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard">
        <Button variant="ghost" size="sm">📥 Export Today</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Today Revenue"    value={formatCurrency(totalRevenue, sym)} sub={`${orders.length} orders total`}          accent="gold"  icon="💰" />
          <StatCard label="Direct / Zomato"  value={`${directOrders.length} / ${zomatoOrders.length}`} sub="orders by source"         accent="blue"  icon="🧾" />
          <StatCard label="Avg Order Value"  value={formatCurrency(avgOrderValue, sym)} sub="per order today"                         accent="green" icon="📊" />
          <StatCard label="Zomato Commission" value={formatCurrency(Math.round(zomatoCommission), sym)} sub={`${commPct}% on ${formatCurrency(zomatoRevenue, sym)}`} accent="red" icon="📉" />
        </div>

        {/* Low stock alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-danger/10 border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger flex items-center gap-2">
            ⚠️ <strong>Low Stock:</strong> {lowStockItems.slice(0,5).map(i => `${i.name} (${i.current_stock} ${i.unit})`).join(' · ')}
            {lowStockItems.length > 5 && ` +${lowStockItems.length - 5} more`}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { href: '/new-order',   icon: '➕', label: 'New Order',    sub: 'Counter / Phone' },
            { href: '/order-queue', icon: '🍳', label: 'Kitchen Queue', sub: `${activeOrders.length} active` },
            { href: '/delivery',    icon: '🛵', label: 'Delivery',      sub: `${orders.filter(o=>o.status==='ready').length} ready` },
            { href: '/inventory',   icon: '📦', label: 'Inventory',     sub: `${lowStockItems.length} items low` },
          ].map(qa => (
            <Link key={qa.href} href={qa.href}
              className="bg-surface border border-border rounded-md p-3.5 hover:border-border2 transition-colors cursor-pointer">
              <div className="text-xl mb-1.5">{qa.icon}</div>
              <div className="text-[13px] font-semibold text-ink">{qa.label}</div>
              <div className="text-[11px] text-ink3 mt-0.5">{qa.sub}</div>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[16px]">Recent Orders</h2>
            <Link href="/order-history" className="text-[11px] text-accent font-medium hover:underline">View all →</Link>
          </div>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['Order #','Time','Source','Address','Items','Amount','Status'].map(h => (
                  <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2 border-b border-border">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {orders.slice(0,5).map(order => (
                  <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-accent text-[12px]">{formatOrderNumber(order.order_number)}</td>
                    <td className="px-3 py-2.5 text-ink3 text-[12px]">{format(new Date(order.created_at), 'h:mm a')}</td>
                    <td className="px-3 py-2.5"><SourceBadge source={order.source} /></td>
                    <td className="px-3 py-2.5 font-semibold text-[13px]">{order.address_short_code ?? '—'}</td>
                    <td className="px-3 py-2.5 text-ink3 text-[12px]">
                      {order.order_items?.map(i => `${i.quantity}× ${i.item_name}${i.note ? ` [${i.note}]` : ''}`).join(', ')}
                    </td>
                    <td className="px-3 py-2.5 font-bold">{formatCurrency(order.total, sym)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

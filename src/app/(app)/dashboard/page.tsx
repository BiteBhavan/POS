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
    supabase.from('orders').select('*, order_items(*)').gte('created_at', startOfDay(today).toISOString()).lte('created_at', endOfDay(today).toISOString()).order('created_at', { ascending: false }),
    supabase.from('inventory_items').select('*, category:inventory_categories(name)').eq('is_active', true),
    supabase.from('app_settings').select('zomato_commission_pct, currency_symbol').single(),
  ])
  const orders: Order[] = ordersRes.data ?? []
  const lowStock = (lowStockRes.data ?? []).filter((i: InventoryItem) => i.current_stock <= i.reorder_level)
  const settings = settingsRes.data
  const sym = settings?.currency_symbol ?? 'Rs.'
  const commPct = settings?.zomato_commission_pct ?? 31
  const active = orders.filter(o => o.status !== 'cancelled')
  const totalRevenue = active.reduce((s, o) => s + o.total, 0)
  const directOrders = orders.filter(o => o.source === 'direct')
  const zomatoOrders = orders.filter(o => o.source === 'zomato')
  const zomatoRev = zomatoOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const commission = (zomatoRev * commPct) / 100
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard">
        <Button variant="ghost" size="sm">📥 Export Today</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Today Revenue" value={formatCurrency(totalRevenue, sym)} sub={`${orders.length} orders`} accent="gold" icon="💰"/>
          <StatCard label="Direct / Zomato" value={`${directOrders.length} / ${zomatoOrders.length}`} sub="orders by source" accent="blue" icon="🧾"/>
          <StatCard label="Avg Order Value" value={formatCurrency(avgOrder, sym)} sub="per order" accent="green" icon="📊"/>
          <StatCard label="Zomato Commission" value={formatCurrency(Math.round(commission), sym)} sub={`${commPct}% on ${formatCurrency(zomatoRev, sym)}`} accent="red" icon="📉"/>
        </div>

        {/* Alert */}
        {lowStock.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-[12px] text-orange-800 flex items-center gap-2">
            ⚠️ <strong>Low Stock:</strong> {lowStock.slice(0,5).map((i: InventoryItem) => i.name).join(' · ')}
            {lowStock.length > 5 && ` +${lowStock.length - 5} more`}
            <Link href="/inventory" className="ml-auto text-accent font-semibold underline-offset-2 hover:underline">View →</Link>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href:'/new-order',   icon:'➕', label:'New Order',    sub:'Counter / Phone' },
            { href:'/order-queue', icon:'🍳', label:'Kitchen Queue', sub:`${orders.filter(o=>!['delivered','cancelled'].includes(o.status)).length} active` },
            { href:'/delivery',    icon:'🛵', label:'Delivery',      sub:`${orders.filter(o=>o.status==='ready').length} ready` },
            { href:'/inventory',   icon:'📦', label:'Inventory',     sub:`${lowStock.length} items low` },
          ].map(qa => (
            <Link key={qa.href} href={qa.href} className="bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-border2 transition-all cursor-pointer">
              <div className="text-xl mb-2">{qa.icon}</div>
              <div className="text-[13px] font-semibold text-ink">{qa.label}</div>
              <div className="text-[11px] text-ink3 mt-0.5">{qa.sub}</div>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-ink">Recent Orders</h2>
            <Link href="/order-history" className="text-[12px] text-accent font-semibold hover:underline">View all →</Link>
          </div>
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>{['Order #','Time','Source','Address','Items','Amount','Status'].map(h => (
                    <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {orders.slice(0,6).map(order => (
                    <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-accent text-[12px]">{formatOrderNumber(order.order_number)}</td>
                      <td className="px-3 py-2.5 text-ink3 text-[12px]">{format(new Date(order.created_at), 'h:mm a')}</td>
                      <td className="px-3 py-2.5"><SourceBadge source={order.source}/></td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-[13px]">{order.address_short_code ?? '—'}</div>
                        {order.address_note && <div className="text-[10px] text-ink3">{order.address_note}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-ink3 text-[12px] max-w-[200px] truncate">
                        {order.order_items?.map(i => `${i.quantity}× ${i.item_name}${i.note ? ` [${i.note}]` : ''}`).join(', ')}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[13px]">{formatCurrency(order.total, sym)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={order.status}/></td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-ink3 text-sm">No orders today yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

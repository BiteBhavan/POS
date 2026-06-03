"use client"
import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatOrderNumber, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Search, Download } from 'lucide-react'
import type { Order } from '@/types'

export function OrderHistoryClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [srcFilter, setSrcFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      o.address_short_code?.toLowerCase().includes(q) ||
      formatOrderNumber(o.order_number).toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      o.zomato_order_id?.includes(q)
    return matchQ && (!srcFilter || o.source === srcFilter) && (!statusFilter || o.status === statusFilter)
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Order History">
        <Button variant="ghost" size="sm" icon={<Download size={13}/>}>Export</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white border border-border rounded-md pl-8 pr-3 py-2 text-[12px] text-ink outline-none focus:border-accent w-52 placeholder:text-ink4"
              placeholder="Order #, address, name…"/>
          </div>
          <select value={srcFilter} onChange={e => setSrcFilter(e.target.value)}
            className="bg-white border border-border rounded-md px-3 py-2 text-[12px] text-ink outline-none focus:border-accent">
            <option value="">All Sources</option>
            <option value="direct">Direct</option>
            <option value="zomato">Zomato</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-border rounded-md px-3 py-2 text-[12px] text-ink outline-none focus:border-accent">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="ml-auto text-[12px] text-ink3 font-medium">{filtered.length} orders</div>
        </div>

        <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[750px]">
              <thead>
                <tr>{['Order #','Date','Source','Address','Customer','Items','Pay','Amount','Status',''].map(h => (
                  <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2.5 border-b border-border bg-surface2 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-accent text-[12px]">{formatOrderNumber(o.order_number)}</td>
                    <td className="px-3 py-2.5 text-ink3 text-[11px] whitespace-nowrap">{format(new Date(o.created_at), 'd MMM, h:mm a')}</td>
                    <td className="px-3 py-2.5"><SourceBadge source={o.source}/></td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-[13px]">{o.address_short_code ?? '—'}</div>
                      {o.address_note && <div className="text-[10px] text-ink3">{o.address_note}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] font-medium text-ink">{o.customer_name ?? '—'}</div>
                      {o.customer_phone && <div className="text-[10px] text-ink3">{o.customer_phone}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] max-w-[180px]">
                      {o.order_items?.map(i => (
                        <div key={i.id} className="text-ink2">
                          {i.quantity}× {i.item_name}
                          {i.note && <span className="text-orange-600 italic text-[10px]"> · {i.note}</span>}
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-ink3 capitalize whitespace-nowrap">{o.payment_mode?.replace('_',' ')}</td>
                    <td className="px-3 py-2.5 font-bold text-[13px] whitespace-nowrap">{formatCurrency(o.total)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={o.status}/></td>
                    <td className="px-3 py-2.5">
                      <button className="bg-surface3 border border-border text-ink3 px-2 py-1 rounded text-[11px] font-medium hover:text-ink transition-colors">🖨️</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-ink3 text-sm">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

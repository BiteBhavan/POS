"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { formatOrderNumber, formatCurrency } from '@/lib/utils'
import { StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order } from '@/types'

export default function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createClient()

  async function fetchOrders() {
    const { data } = await supabase.from('orders')
      .select('*, order_items(*)')
      .in('status', ['pending','preparing','ready','out_for_delivery'])
      .order('created_at', { ascending: true })
    setOrders((data ?? []) as Order[])
  }

  useEffect(() => {
    fetchOrders()
    const channel = supabase.channel('delivery').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function markDelivered(id: string, num: number) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', id)
    toast.success(`${formatOrderNumber(num)} delivered!`)
    fetchOrders()
  }

  const readyOrders  = orders.filter(o => o.status === 'ready')
  const activeOrders = orders

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Delivery View" />
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Ready for delivery */}
        <div>
          <h2 className="font-display text-[16px] mb-3">🟢 Ready for Delivery ({readyOrders.length})</h2>
          <div className="grid grid-cols-2 gap-3">
            {readyOrders.map(order => (
              <div key={order.id} className="bg-surface border border-border border-l-[3px] border-l-success rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex justify-between items-start">
                  <div>
                    <div className="font-display text-[22px] text-ink">{order.address_short_code ?? '—'}</div>
                    {order.address_note && <div className="text-[11px] text-ink3 mt-0.5">{order.address_note}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-accent text-[12px]">{formatOrderNumber(order.order_number)}</div>
                    <SourceBadge source={order.source} />
                  </div>
                </div>
                <div className="px-4 py-3 text-[12px] text-ink2 space-y-1">
                  {order.order_items?.map(i => (
                    <div key={i.id}>
                      {i.quantity}× {i.item_name}
                      {i.note && <span className="text-warn italic"> · {i.note}</span>}
                    </div>
                  ))}
                  <div className="font-bold text-accent mt-1.5">{formatCurrency(order.total)}</div>
                </div>
                <div className="px-4 py-3 border-t border-border flex gap-2">
                  <button onClick={() => markDelivered(order.id, order.order_number)}
                    className="flex-1 py-2 rounded-md bg-success/10 text-success text-[12px] font-semibold border border-success/20 hover:bg-success hover:text-white transition-all">
                    ✓ Mark Delivered
                  </button>
                  <button className="px-4 py-2 rounded-md bg-surface3 border border-border text-ink3 text-[12px] font-semibold hover:text-ink transition-colors">
                    🖨️
                  </button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && <div className="col-span-2 py-8 text-center text-ink3 text-sm">No orders ready yet</div>}
          </div>
        </div>

        {/* All active */}
        <div>
          <h2 className="font-display text-[16px] mb-3">📋 All Active Orders</h2>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr>{['Order #','Address','Items & Notes','Amount','Status'].map(h => (
                <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2 border-b border-border">{h}</th>
              ))}</tr></thead>
              <tbody>
                {activeOrders.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-bold text-accent text-[12px]">{formatOrderNumber(o.order_number)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-[14px]">{o.address_short_code ?? '—'}</div>
                      {o.address_note && <div className="text-[10px] text-ink3">{o.address_note}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[12px]">
                      {o.order_items?.map(i => (
                        <div key={i.id} className="text-ink2">
                          {i.quantity}× {i.item_name}
                          {i.note && <span className="text-warn italic text-[10px]"> · {i.note}</span>}
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-2.5 font-bold">{formatCurrency(o.total)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
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

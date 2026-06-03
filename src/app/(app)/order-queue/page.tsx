"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatOrderNumber, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { StickyNote, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderStatus } from '@/types'

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready']

export default function OrderQueuePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders').select('*, order_items(*)')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: true })
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    // Real-time subscription
    const channel = supabase.channel('orders-kds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function updateStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) toast.error('Update failed')
    else { toast.success(`Order marked ${status}`); fetchOrders() }
  }

  const pending   = orders.filter(o => o.status === 'pending')
  const preparing = orders.filter(o => o.status === 'preparing')
  const ready     = orders.filter(o => o.status === 'ready')

  const borderColor: Record<string, string> = { pending: 'border-t-warn', preparing: 'border-t-info', ready: 'border-t-success' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Order Queue">
        <Button variant="ghost" size="sm" icon={<RefreshCw size={13}/>} onClick={fetchOrders}>Refresh</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Counts */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="bg-warn/10 border border-warn/20 rounded-md px-4 py-2 text-[12px] text-warn font-semibold">⏳ Pending: {pending.length}</div>
          <div className="bg-info/10 border border-info/20 rounded-md px-4 py-2 text-[12px] text-info font-semibold">👨‍🍳 Preparing: {preparing.length}</div>
          <div className="bg-success/10 border border-success/20 rounded-md px-4 py-2 text-[12px] text-success font-semibold">✅ Ready: {ready.length}</div>
          <div className="ml-auto text-[11px] text-ink3 self-center">Live · auto-updates</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-ink3 text-sm">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-ink3 text-sm">No active orders 🎉</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {orders.map(order => {
              const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
              const isUrgent = elapsed > 20
              return (
                <div key={order.id} className={cn('bg-surface border border-border rounded-lg overflow-hidden border-t-2', borderColor[order.status])}>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border flex justify-between items-start">
                    <div>
                      <div className="font-display text-[20px] text-accent">{formatOrderNumber(order.order_number)}</div>
                      <div className="text-[12px] text-ink2 font-semibold mt-0.5">{order.address_short_code ?? 'Zomato'}</div>
                      {order.address_note && <div className="text-[11px] text-ink3">{order.address_note}</div>}
                    </div>
                    <div className="text-right">
                      <SourceBadge source={order.source} />
                      <div className={cn('text-[12px] font-bold mt-1', isUrgent ? 'text-danger' : 'text-warn')}>
                        ⏱ {elapsed}m
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between items-start py-1.5 border-b border-border last:border-b-0 gap-2">
                        <div className="flex-1">
                          <div className="text-[13px] text-ink font-medium">{item.item_name}</div>
                          {item.note && (
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-warn italic">
                              <StickyNote size={10} className="opacity-70" />{item.note}
                            </div>
                          )}
                        </div>
                        <div className="text-[14px] font-bold text-accent flex-shrink-0">×{item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="px-4 py-3 border-t border-border">
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'preparing')}
                        className="w-full py-2 rounded-md bg-info/10 text-info text-[12px] font-semibold border border-info/20 hover:bg-info hover:text-white transition-all">
                        ▶ Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full py-2 rounded-md bg-success/10 text-success text-[12px] font-semibold border border-success/20 hover:bg-success hover:text-white transition-all">
                        ✓ Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="text-center text-[12px] text-success font-semibold py-1">✅ Ready for Pickup</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

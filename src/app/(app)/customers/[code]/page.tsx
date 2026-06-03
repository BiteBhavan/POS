import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { formatOrderNumber, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, ShoppingBag } from 'lucide-react'

export default async function CustomerDetailPage({ params }: { params: { code: string } }) {
  const supabase = createClient()
  const code = decodeURIComponent(params.code)

  const [addressRes, ordersRes] = await Promise.all([
    supabase.from('saved_addresses').select('*').eq('short_code', code).single(),
    supabase.from('orders').select('*, order_items(*)')
      .eq('address_short_code', code)
      .order('created_at', { ascending: false }),
  ])

  if (addressRes.error && !ordersRes.data?.length) notFound()

  const address = addressRes.data
  const orders = ordersRes.data ?? []
  const totalSpend = orders.filter(o => o.status !== 'cancelled').reduce((s: number, o: any) => s + o.total, 0)
  const lastOrder = orders[0]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={address?.primary_name ?? code}>
        <Link href="/customers" className="flex items-center gap-1.5 text-[12px] text-ink3 hover:text-ink transition-colors">
          <ArrowLeft size={14}/> Back to Customers
        </Link>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Customer card */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg font-bold text-accent flex-shrink-0">
                {(address?.primary_name ?? code).slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-[18px] font-bold text-ink">{address?.primary_name ?? '—'}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-[12px] text-ink3">
                  <span className="flex items-center gap-1"><MapPin size={12}/> {code}</span>
                  {address?.phone && <span className="flex items-center gap-1"><Phone size={12}/> {address.phone}</span>}
                  {address?.detail && address.detail !== address.primary_name && (
                    <span>{address.detail}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-[22px] font-bold text-accent">{orders.length}</div>
                <div className="text-[11px] text-ink3 uppercase tracking-wider font-semibold">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-bold text-success">{formatCurrency(totalSpend)}</div>
                <div className="text-[11px] text-ink3 uppercase tracking-wider font-semibold">Total Spend</div>
              </div>
              <div className="text-center">
                <div className="text-[16px] font-bold text-ink">{lastOrder ? format(new Date(lastOrder.created_at), 'd MMM yy') : '—'}</div>
                <div className="text-[11px] text-ink3 uppercase tracking-wider font-semibold">Last Order</div>
              </div>
            </div>
          </div>

          {/* Order history */}
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-surface2 flex items-center gap-2">
              <ShoppingBag size={14} className="text-ink3"/>
              <h2 className="font-semibold text-[14px] text-ink">Order History ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <div className="py-10 text-center text-ink3 text-sm">No orders found</div>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order: any) => (
                  <div key={order.id} className="px-5 py-3 hover:bg-surface2 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/order-history/${order.id}`}
                            className="font-bold text-accent text-[13px] hover:underline underline-offset-2">
                            {formatOrderNumber(order.order_number)}
                          </Link>
                          <span className="text-[11px] text-ink3">{format(new Date(order.created_at), 'd MMM yyyy, h:mm a')}</span>
                          <SourceBadge source={order.source}/>
                        </div>
                        <div className="text-[12px] text-ink3">
                          {order.order_items?.map((i: any) => `${i.quantity}× ${i.item_name}`).join(', ')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="font-bold text-[13px]">{formatCurrency(order.total)}</div>
                        <StatusBadge status={order.status}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

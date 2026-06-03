import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { formatOrderNumber, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: order } = await supabase
    .from('orders').select('*, order_items(*)')
    .eq('id', params.id).single()
  if (!order) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={formatOrderNumber(order.order_number)}>
        <Link href="/order-history" className="flex items-center gap-1.5 text-[12px] text-ink3 hover:text-ink transition-colors">
          <ArrowLeft size={14}/> Back to Orders
        </Link>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header card */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[22px] font-bold text-accent">{formatOrderNumber(order.order_number)}</div>
                <div className="text-[13px] text-ink3 mt-0.5">{format(new Date(order.created_at), 'EEEE, d MMMM yyyy — h:mm a')}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={order.status}/>
                <SourceBadge source={order.source}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-1">Address</div>
                <div className="font-bold text-[15px] text-ink">{order.address_short_code ?? '—'}</div>
                {order.address_note && <div className="text-ink3 text-[11px]">{order.address_note}</div>}
              </div>
              <div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-1">Customer</div>
                {order.customer_name ? (
                  <Link href={`/customers/${encodeURIComponent(order.address_short_code ?? '')}`}
                    className="font-semibold text-accent hover:underline underline-offset-2">
                    {order.customer_name}
                  </Link>
                ) : <div className="text-ink3">—</div>}
                {order.customer_phone && <div className="text-ink3 text-[11px]">{order.customer_phone}</div>}
              </div>
              <div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-1">Payment</div>
                <div className="font-medium capitalize">{order.payment_mode?.replace('_',' ')}</div>
              </div>
              {order.zomato_order_id && (
                <div>
                  <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-1">Zomato ID</div>
                  <div className="font-medium">{order.zomato_order_id}</div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-surface2">
              <h2 className="font-semibold text-[14px] text-ink">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-ink">{item.item_name}</div>
                    {item.note && (
                      <div className="text-[11px] text-orange-600 italic mt-0.5">📝 {item.note}</div>
                    )}
                  </div>
                  <div className="text-[13px] text-ink3">×{item.quantity}</div>
                  <div className="text-[13px] font-semibold text-ink w-20 text-right">
                    {formatCurrency(item.total_price || item.unit_price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface2">
              <div className="flex justify-between text-[13px] text-ink3 mb-1">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[13px] text-danger mb-1">
                  <span>Discount</span><span>−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-bold text-ink pt-2 border-t border-border mt-1">
                <span>Total</span><span className="text-accent">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-[13px] text-orange-800">
              📝 <strong>Note:</strong> {order.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

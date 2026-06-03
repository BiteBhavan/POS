"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, SourceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { formatOrderNumber, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Search, Download, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Order, OrderStatus, PaymentMode } from '@/types'

export function OrderHistoryClient({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial)
  const [search, setSearch] = useState('')
  const [srcFilter, setSrcFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const supabase = createClient()

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      o.address_short_code?.toLowerCase().includes(q) ||
      formatOrderNumber(o.order_number).toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q)
    return matchQ && (!srcFilter || o.source === srcFilter) && (!statusFilter || o.status === statusFilter)
  })

  async function handleSaveEdit() {
    if (!editOrder) return
    setSaving(true)
    try {
      const { error } = await supabase.from('orders').update({
        status: editOrder.status, payment_mode: editOrder.payment_mode,
        address_short_code: editOrder.address_short_code,
        customer_name: editOrder.customer_name,
        customer_phone: editOrder.customer_phone,
        total: editOrder.total, discount: editOrder.discount, notes: editOrder.notes,
      }).eq('id', editOrder.id)
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === editOrder.id ? { ...o, ...editOrder } : o))
      toast.success(formatOrderNumber(editOrder.order_number) + ' updated!')
      setEditOrder(null)
    } catch (e: any) { toast.error('Update failed: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteOrder) return
    setDeleting(true)
    try {
      await supabase.from('order_items').delete().eq('order_id', deleteOrder.id)
      const { error } = await supabase.from('orders').delete().eq('id', deleteOrder.id)
      if (error) throw error
      setOrders(prev => prev.filter(o => o.id !== deleteOrder.id))
      toast.success(formatOrderNumber(deleteOrder.order_number) + ' deleted')
      setDeleteOrder(null)
    } catch (e: any) { toast.error('Delete failed: ' + e.message) }
    finally { setDeleting(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Order History">
        <Button variant="ghost" size="sm" icon={<Download size={13}/>}>Export</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-md pl-8 pr-3 py-2 text-[12px] text-ink outline-none focus:border-accent placeholder:text-ink4"
              placeholder="Search order, name, address…"/>
          </div>
          <select value={srcFilter} onChange={e => setSrcFilter(e.target.value)}
            className="bg-white border border-border rounded-md px-2 py-2 text-[12px] text-ink outline-none focus:border-accent">
            <option value="">All Sources</option>
            <option value="direct">Direct</option><option value="zomato">Zomato</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-border rounded-md px-2 py-2 text-[12px] text-ink outline-none focus:border-accent">
            <option value="">All Status</option>
            <option value="pending">Pending</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
          </select>
          <span className="text-[11px] text-ink3 font-medium ml-auto">{filtered.length} orders</span>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {filtered.map(o => (
            <div key={o.id} className="bg-white border border-border rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link href={`/order-history/${o.id}`} className="font-bold text-accent text-[13px] hover:underline">{formatOrderNumber(o.order_number)}</Link>
                  <span className="text-ink3 text-[11px] ml-2">{format(new Date(o.created_at), 'd MMM, h:mm a')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={o.status}/>
                  {isOwner && <>
                    <button onClick={() => setEditOrder({...o})} className="p-1.5 rounded text-ink3 hover:text-accent hover:bg-accent/10"><Pencil size={13}/></button>
                    <button onClick={() => setDeleteOrder(o)} className="p-1.5 rounded text-ink3 hover:text-danger hover:bg-danger/10"><Trash2 size={13}/></button>
                  </>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[12px] mb-2">
                <div><span className="text-ink3">Address: </span><span className="font-semibold">{o.address_short_code ?? '—'}</span></div>
                <div><span className="text-ink3">Customer: </span>
                  {o.customer_name && o.address_short_code
                    ? <Link href={`/customers/${encodeURIComponent(o.address_short_code)}`} className="font-medium text-accent hover:underline">{o.customer_name}</Link>
                    : <span>{o.customer_name ?? '—'}</span>
                  }
                </div>
                <div><span className="text-ink3">Payment: </span><span className="capitalize">{o.payment_mode?.replace('_',' ')}</span></div>
                <div><span className="text-ink3">Amount: </span><span className="font-bold text-accent">{formatCurrency(o.total)}</span></div>
              </div>
              <div className="text-[11px] text-ink3 border-t border-border pt-2">
                {o.order_items?.map(i => <span key={i.id} className="mr-2">{i.quantity}× {i.item_name}{i.note ? ` [${i.note}]` : ''}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>{['Order #','Date','Source','Address','Customer','Items','Pay','Amount','Status', isOwner ? 'Actions' : ''].map(h => (
                  <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2.5 border-b border-border bg-surface2 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link href={`/order-history/${o.id}`} className="font-bold text-accent text-[12px] hover:underline underline-offset-2">
                        {formatOrderNumber(o.order_number)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink3 text-[11px] whitespace-nowrap">{format(new Date(o.created_at), 'd MMM, h:mm a')}</td>
                    <td className="px-3 py-2.5"><SourceBadge source={o.source}/></td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-[13px]">{o.address_short_code ?? '—'}</div>
                      {o.address_note && <div className="text-[10px] text-ink3">{o.address_note}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.customer_name && o.address_short_code
                        ? <Link href={`/customers/${encodeURIComponent(o.address_short_code)}`} className="text-[12px] font-medium text-accent hover:underline underline-offset-2">{o.customer_name}</Link>
                        : <span className="text-[12px] text-ink3">—</span>
                      }
                      {o.customer_phone && <div className="text-[10px] text-ink3">{o.customer_phone}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] max-w-[180px]">
                      {o.order_items?.map(i => (
                        <div key={i.id} className="text-ink2">{i.quantity}× {i.item_name}{i.note ? <span className="text-orange-600 italic text-[10px]"> · {i.note}</span> : ''}</div>
                      ))}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-ink3 capitalize whitespace-nowrap">{o.payment_mode?.replace('_',' ')}</td>
                    <td className="px-3 py-2.5 font-bold text-[13px] whitespace-nowrap">{formatCurrency(o.total)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={o.status}/></td>
                    {isOwner && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditOrder({...o})} className="p-1.5 rounded text-ink3 hover:text-accent hover:bg-accent/10 transition-all" title="Edit"><Pencil size={13}/></button>
                          <button onClick={() => setDeleteOrder(o)} className="p-1.5 rounded text-ink3 hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={isOwner ? 10 : 9} className="text-center py-10 text-ink3 text-sm">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal open={!!editOrder} onClose={() => setEditOrder(null)}
        title={'Edit ' + (editOrder ? formatOrderNumber(editOrder.order_number) : '')}
        footer={<><Button variant="ghost" onClick={() => setEditOrder(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSaveEdit}>Save</Button></>}>
        {editOrder && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Address" value={editOrder.address_short_code ?? ''} onChange={e => setEditOrder(p => p ? {...p, address_short_code: e.target.value} : p)}/>
              <Input label="Customer Name" value={editOrder.customer_name ?? ''} onChange={e => setEditOrder(p => p ? {...p, customer_name: e.target.value} : p)}/>
              <Input label="Mobile" value={editOrder.customer_phone ?? ''} onChange={e => setEditOrder(p => p ? {...p, customer_phone: e.target.value} : p)}/>
              <Select label="Payment" value={editOrder.payment_mode} onChange={e => setEditOrder(p => p ? {...p, payment_mode: e.target.value as PaymentMode} : p)}>
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="zomato_pay">Zomato Pay</option>
              </Select>
              <Input label="Total Rs." type="number" value={editOrder.total} onChange={e => setEditOrder(p => p ? {...p, total: Number(e.target.value)} : p)}/>
              <Input label="Discount Rs." type="number" value={editOrder.discount} onChange={e => setEditOrder(p => p ? {...p, discount: Number(e.target.value)} : p)}/>
            </div>
            <Select label="Status" value={editOrder.status} onChange={e => setEditOrder(p => p ? {...p, status: e.target.value as OrderStatus} : p)}>
              <option value="pending">Pending</option><option value="preparing">Preparing</option><option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
            </Select>
            <Input label="Notes" value={editOrder.notes ?? ''} onChange={e => setEditOrder(p => p ? {...p, notes: e.target.value} : p)} placeholder="Optional…"/>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal open={!!deleteOrder} onClose={() => setDeleteOrder(null)} title="Delete Order"
        footer={<><Button variant="ghost" onClick={() => setDeleteOrder(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Yes, Delete</Button></>}>
        {deleteOrder && (
          <div>
            <p className="text-[14px] text-ink mb-3">Delete <strong>{formatOrderNumber(deleteOrder.order_number)}</strong>?</p>
            <div className="bg-surface2 border border-border rounded-lg p-3 text-[12px] space-y-1 mb-3">
              <div><span className="text-ink3">Customer: </span><span className="font-medium">{deleteOrder.customer_name ?? '—'}</span></div>
              <div><span className="text-ink3">Amount: </span><span className="font-bold text-accent">{formatCurrency(deleteOrder.total)}</span></div>
              <div><span className="text-ink3">Date: </span><span className="font-medium">{format(new Date(deleteOrder.created_at), 'd MMM yyyy, h:mm a')}</span></div>
            </div>
            <div className="bg-danger/8 border border-danger/20 rounded-lg px-3 py-2 text-[12px] text-danger">⚠️ Cannot be undone.</div>
          </div>
        )}
      </Modal>
    </div>
  )
}

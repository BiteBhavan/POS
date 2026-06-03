"use client"
import { useState, useCallback } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { Minus, Plus, X, StickyNote, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { MenuItem, MenuCategory, SavedAddress, OrderSource, PaymentMode } from '@/types'

interface Props { menuItems: MenuItem[]; categories: MenuCategory[]; savedAddresses: SavedAddress[] }

export function NewOrderClient({ menuItems, categories, savedAddresses }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { items, source, priceList, addressShortCode, addressNote, customerPhone,
    zomatoOrderId, paymentMode, discount, addItem, updateQty, updateNote,
    setSource, setField, clearCart } = useCartStore()
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  const [activeCat, setActiveCat] = useState<string>('all')
  const [placing, setPlacing] = useState(false)
  const [addrOpen, setAddrOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')

  const filteredItems = activeCat === 'all' ? menuItems : menuItems.filter(m => m.category?.slug === activeCat)
  const sym = 'Rs.'

  const getPrice = useCallback((item: MenuItem) => priceList === 'zomato' ? item.zomato_price : item.direct_price, [priceList])

  function handleSourceChange(s: OrderSource) {
    setSource(s)
    // re-price cart items
    items.forEach(ci => {
      const menuItem = menuItems.find(m => m.id === ci.menuItemId)
      if (menuItem) {
        const newPrice = s === 'zomato' ? menuItem.zomato_price : menuItem.direct_price
        if (newPrice !== ci.unitPrice) {
          // update via store (will need custom store action in production)
        }
      }
    })
  }

  async function handlePlaceOrder() {
    if (!items.length) { toast.error('Add items first'); return }
    if (source !== 'zomato' && !addressShortCode.trim()) { toast.error('Address is required'); return }
    setPlacing(true)
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        source, status: 'pending', price_list: priceList,
        address_short_code: addressShortCode || null,
        address_note: addressNote || null,
        customer_phone: customerPhone || null,
        zomato_order_id: zomatoOrderId || null,
        payment_mode: paymentMode, subtotal, discount, total,
      }).select().single()
      if (error) throw error

      await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id,
          menu_item_id: i.menuItemId,
          item_name: i.name,
          item_emoji: i.emoji,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.unitPrice * i.quantity,
          note: i.note || null,
        }))
      )
      clearCart()
      toast.success(`Order BB-${String(order.order_number).padStart(4,'0')} placed!`)
      router.push('/order-queue')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to place order')
    } finally { setPlacing(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Order">
        <Button variant="ghost" size="sm" icon={<MapPin size={13}/>} onClick={() => setAddrOpen(true)}>
          Address Book
        </Button>
      </Topbar>

      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_340px] gap-4 p-4">
        {/* LEFT: Menu */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {[{ id: 'all', name: 'All Items' }, ...categories].map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id === 'all' ? 'all' : (cat as MenuCategory).slug)}
                className={cn(
                  'px-3 py-1 rounded-full text-[12px] font-semibold border transition-all',
                  activeCat === (cat.id === 'all' ? 'all' : (cat as MenuCategory).slug)
                    ? 'bg-accent/10 text-accent-light border-accent'
                    : 'bg-surface2 text-ink3 border-border hover:text-ink2 hover:border-border2'
                )}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-2">
            {filteredItems.map(item => {
              const inCart = items.find(i => i.menuItemId === item.id)
              const price = getPrice(item)
              return (
                <button key={item.id} disabled={!item.is_available}
                  onClick={() => addItem({ menuItemId: item.id, name: item.name, emoji: item.emoji, unitPrice: price, note: '' })}
                  className={cn(
                    'relative bg-surface2 border rounded-md p-2.5 text-left transition-all',
                    item.is_available ? 'cursor-pointer hover:border-border2 hover:-translate-y-px' : 'opacity-35 cursor-not-allowed',
                    inCart ? 'border-accent bg-accent/5' : 'border-border'
                  )}>
                  {inCart && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-[#1a1400] rounded-full text-[10px] font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </div>
                  )}
                  <span className="text-xl block mb-1.5">{item.emoji}</span>
                  <div className="text-[11.5px] font-semibold text-ink mb-1 leading-tight">{item.name}</div>
                  <div className="text-[12px] font-bold text-accent">{formatCurrency(price, sym)}</div>
                  {!item.is_available && <div className="text-[10px] text-danger mt-0.5">Unavailable</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Order panel */}
        <div className="bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span>🧾</span>
            <span className="font-display text-[16px]">New Order</span>
            <span className="ml-auto text-[11px] text-ink3 font-medium">BB-NEXT</span>
          </div>

          {/* Source + fields */}
          <div className="px-4 py-3 border-b border-border space-y-3">
            <div>
              <label className="text-[10px] text-ink3 uppercase tracking-wider font-semibold block mb-1.5">Source</label>
              <div className="flex gap-1.5">
                {(['direct','zomato','whatsapp'] as OrderSource[]).map(s => (
                  <button key={s} onClick={() => handleSourceChange(s)}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-[11px] font-semibold border transition-all',
                      source === s ? 'bg-accent/10 text-accent-light border-accent' : 'bg-surface2 text-ink3 border-border'
                    )}>
                    {s === 'direct' ? '🏠 Direct' : s === 'zomato' ? '🔴 Zomato' : '💬 WA'}
                  </button>
                ))}
              </div>
            </div>

            {source !== 'zomato' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Short Code" placeholder="F-204" value={addressShortCode} onChange={e => setField('addressShortCode', e.target.value)} className="font-bold" />
                  <Input label="Note" placeholder="3rd floor" value={addressNote} onChange={e => setField('addressNote', e.target.value)} />
                </div>
                <Input label="Mobile (optional)" placeholder="98765 43210" value={customerPhone} onChange={e => setField('customerPhone', e.target.value)} />
              </>
            ) : (
              <Input label="Zomato Order ID" placeholder="ZO-XXXXXXXX" value={zomatoOrderId} onChange={e => setField('zomatoOrderId', e.target.value)} />
            )}

            <div className="grid grid-cols-2 gap-2">
              <Select label="Payment" value={paymentMode} onChange={e => setField('paymentMode', e.target.value as PaymentMode)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                {source === 'zomato' && <option value="zomato_pay">Zomato Pay</option>}
              </Select>
              <Input label="Discount Rs." type="number" placeholder="0" value={discount || ''} onChange={e => setField('discount', Number(e.target.value))} />
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center text-ink4 text-[12px]">Tap menu items to add</div>
            ) : (
              items.map(ci => (
                <div key={ci.menuItemId} className="border-b border-border px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 text-[13px] font-semibold text-ink">{ci.name}</div>
                    <div className="text-[13px] font-bold text-accent whitespace-nowrap">{formatCurrency(ci.unitPrice * ci.quantity, sym)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(ci.menuItemId, -1)} className="w-6 h-6 bg-surface3 border border-border rounded flex items-center justify-center text-ink2 hover:bg-accent hover:text-[#1a1400] hover:border-accent transition-all">
                        <Minus size={11} />
                      </button>
                      <span className="text-[12px] font-bold w-5 text-center">{ci.quantity}</span>
                      <button onClick={() => updateQty(ci.menuItemId, 1)} className="w-6 h-6 bg-surface3 border border-border rounded flex items-center justify-center text-ink2 hover:bg-accent hover:text-[#1a1400] hover:border-accent transition-all">
                        <Plus size={11} />
                      </button>
                    </div>
                    {/* Note field */}
                    {editingNote === ci.menuItemId ? (
                      <input autoFocus className="flex-1 bg-surface3 border border-border rounded px-2 py-1 text-[11px] text-ink2 outline-none focus:border-border2 placeholder:text-ink4"
                        placeholder="No onion, extra spicy…"
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        onBlur={() => { updateNote(ci.menuItemId, noteInput); setEditingNote(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') { updateNote(ci.menuItemId, noteInput); setEditingNote(null) } }}
                      />
                    ) : ci.note ? (
                      <button onClick={() => { setEditingNote(ci.menuItemId); setNoteInput(ci.note) }}
                        className="flex-1 flex items-center gap-1.5 bg-surface3 rounded px-2 py-1 text-[11px] text-ink3 italic hover:text-ink2 border border-transparent hover:border-border">
                        <StickyNote size={10} className="opacity-60" />{ci.note}
                      </button>
                    ) : (
                      <button onClick={() => { setEditingNote(ci.menuItemId); setNoteInput('') }}
                        className="flex-1 flex items-center gap-1.5 bg-surface3 rounded px-2 py-1 text-[11px] text-ink4 italic hover:text-ink3 border border-transparent hover:border-border">
                        <StickyNote size={10} className="opacity-40" /> Add note…
                      </button>
                    )}
                    {ci.note && editingNote !== ci.menuItemId && (
                      <button onClick={() => updateNote(ci.menuItemId, '')} className="text-ink4 hover:text-ink3">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total + place */}
          <div className="px-4 py-3 border-t border-border bg-surface2">
            {items.length > 0 && (
              <>
                <div className="flex justify-between text-[12px] text-ink3 mb-1"><span>Subtotal</span><span>{formatCurrency(subtotal, sym)}</span></div>
                {discount > 0 && <div className="flex justify-between text-[12px] text-ink3 mb-1"><span>Discount</span><span>−{formatCurrency(discount, sym)}</span></div>}
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-[15px] font-bold text-ink mb-0"><span>Total</span><span className="text-accent">{formatCurrency(total, sym)}</span></div>
              </>
            )}
            <button onClick={handlePlaceOrder} disabled={placing || !items.length}
              className="mt-3 w-full py-3 bg-accent text-[#1a1400] rounded-lg font-display text-[15px] transition-all hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed">
              {placing ? 'Placing…' : '🖨 Place Order & Print KOT'}
            </button>
          </div>
        </div>
      </div>

      {/* Address Book Modal */}
      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="📍 Address Book"
        footer={<><Button variant="ghost" onClick={() => setAddrOpen(false)}>Close</Button><Button variant="primary" onClick={() => setAddrOpen(false)}>+ Add New</Button></>}>
        <p className="text-[12px] text-ink3 mb-3">Recent addresses — tap to fill</p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {savedAddresses.map(a => (
            <button key={a.id} onClick={() => { setField('addressShortCode', a.short_code); setField('addressNote', a.detail ?? ''); setAddrOpen(false) }}
              className="w-full flex items-center gap-3 bg-surface2 border border-border rounded-lg p-3 hover:border-border2 transition-colors text-left">
              <span className="font-display text-[18px] text-accent flex-shrink-0">{a.short_code}</span>
              <div>
                <div className="text-[12px] text-ink2">{a.detail}</div>
                <div className="text-[11px] text-ink3">{a.order_count} orders</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

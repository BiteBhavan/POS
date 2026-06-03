"use client"
import { useState, useCallback } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { Minus, Plus, X, StickyNote, MapPin, Search, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { MenuItem, MenuCategory, SavedAddress, OrderSource, PaymentMode } from '@/types'

interface Props { menuItems: MenuItem[]; categories: MenuCategory[]; savedAddresses: SavedAddress[] }

export function NewOrderClient({ menuItems, categories, savedAddresses }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { items, source, priceList, addItem, updateQty, updateNote, setSource, clearCart } = useCartStore()

  const [addressShortCode, setAddressShortCode] = useState('')
  const [addressNote, setAddressNote] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [zomatoOrderId, setZomatoOrderId] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [discount, setDiscount] = useState(0)
  const [activeCat, setActiveCat] = useState('all')
  const [placing, setPlacing] = useState(false)
  const [addrOpen, setAddrOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false) // mobile cart drawer
  const [addrSearch, setAddrSearch] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')

  // Autofill dropdowns
  const [addrSugg, setAddrSugg] = useState<SavedAddress[]>([])
  const [nameSugg, setNameSugg] = useState<SavedAddress[]>([])
  const [phoneSugg, setPhoneSugg] = useState<SavedAddress[]>([])
  const [showAddrDrop, setShowAddrDrop] = useState(false)
  const [showNameDrop, setShowNameDrop] = useState(false)
  const [showPhoneDrop, setShowPhoneDrop] = useState(false)

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)
  const filteredItems = activeCat === 'all' ? menuItems : menuItems.filter(m => m.category?.slug === activeCat)
  const sym = 'Rs.'
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  function autofill(addr: SavedAddress) {
    setAddressShortCode(addr.short_code)
    if (addr.primary_name) setCustomerName(addr.primary_name)
    if (addr.phone) setCustomerPhone(addr.phone)
    setShowAddrDrop(false); setShowNameDrop(false); setShowPhoneDrop(false)
  }

  function onAddrChange(v: string) {
    setAddressShortCode(v)
    if (v.length >= 1) {
      const m = savedAddresses.filter(a => a.short_code.toLowerCase().includes(v.toLowerCase())).slice(0,5)
      setAddrSugg(m); setShowAddrDrop(m.length > 0)
    } else setShowAddrDrop(false)
  }

  function onNameChange(v: string) {
    setCustomerName(v)
    if (v.length >= 2) {
      const m = savedAddresses.filter(a => a.primary_name?.toLowerCase().includes(v.toLowerCase())).slice(0,5)
      setNameSugg(m); setShowNameDrop(m.length > 0)
    } else setShowNameDrop(false)
  }

  function onPhoneChange(v: string) {
    setCustomerPhone(v)
    if (v.length >= 4) {
      const m = savedAddresses.filter(a => a.phone?.includes(v)).slice(0,5)
      setPhoneSugg(m); setShowPhoneDrop(m.length > 0)
    } else setShowPhoneDrop(false)
  }

  const getPrice = useCallback((item: MenuItem) => priceList === 'zomato' ? item.zomato_price : item.direct_price, [priceList])

  const { user } = useAuthStore()
  const isViewer = user?.role === 'viewer'

  async function handlePlaceOrder() {
    if (isViewer) { toast.error('View only access - cannot place orders'); return }
    if (!items.length) { toast.error('Add items first'); return }
    if (source !== 'zomato' && !addressShortCode.trim()) { toast.error('Address is required'); return }
    setPlacing(true)
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        source, status: 'pending', price_list: priceList,
        address_short_code: addressShortCode || null,
        address_note: addressNote || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        zomato_order_id: zomatoOrderId || null,
        payment_mode: paymentMode, subtotal, discount, total,
      }).select().single()
      if (error) throw error
      await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id, menu_item_id: i.menuItemId,
          item_name: i.name, item_emoji: i.emoji,
          quantity: i.quantity, unit_price: i.unitPrice,
          total_price: i.unitPrice * i.quantity, note: i.note || null,
        }))
      )
      clearCart()
      setAddressShortCode(''); setAddressNote(''); setCustomerName('')
      setCustomerPhone(''); setZomatoOrderId(''); setDiscount(0)
      setCartOpen(false)
      toast.success('BB-' + String(order.order_number).padStart(4,'0') + ' placed!')
      router.push('/order-queue')
    } catch (e: any) { toast.error(e.message ?? 'Failed') }
    finally { setPlacing(false) }
  }

  const SuggDrop = ({ list, onSelect }: { list: SavedAddress[]; onSelect: (a: SavedAddress) => void }) => (
    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-border rounded-md shadow-lg mt-0.5 overflow-hidden">
      {list.map(a => (
        <div key={a.id} onClick={() => onSelect(a)}
          className="px-3 py-2 hover:bg-surface3 cursor-pointer border-b border-border last:border-b-0 flex items-center gap-2">
          <span className="font-bold text-accent text-[13px]">{a.short_code}</span>
          {a.primary_name && <span className="text-ink2 text-[12px] flex-1 truncate">{a.primary_name}</span>}
          {a.phone && <span className="text-ink3 text-[11px]">{a.phone}</span>}
        </div>
      ))}
    </div>
  )

  const CartContent = () => (
    <>
      {/* Source selector */}
      <div className="px-4 py-3 border-b border-border bg-surface2 space-y-3">
        <div>
          <label className="text-[10px] text-ink2 uppercase tracking-wider font-semibold block mb-1.5">Source</label>
          <div className="flex gap-1.5">
            {(['direct','zomato','whatsapp'] as OrderSource[]).map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={cn('flex-1 py-2 rounded-md text-[12px] font-semibold border transition-all',
                  source === s ? 'bg-accent text-white border-accent' : 'bg-white text-ink3 border-border')}>
                {s === 'direct' ? '🏠 Direct' : s === 'zomato' ? '🔴 Zomato' : '💬 WA'}
              </button>
            ))}
          </div>
        </div>
        {source !== 'zomato' ? (
          <>
            <div className="relative">
              <label className="text-[10px] text-ink2 uppercase tracking-wider font-semibold block mb-1">Address *</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                placeholder="F-204, P-301…" value={addressShortCode}
                onChange={e => onAddrChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowAddrDrop(false), 150)}/>
              {showAddrDrop && <SuggDrop list={addrSugg} onSelect={autofill}/>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <label className="text-[10px] text-ink2 uppercase tracking-wider font-semibold block mb-1">Name</label>
                <input className="w-full border border-border rounded-md px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  placeholder="Customer name" value={customerName}
                  onChange={e => onNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowNameDrop(false), 150)}/>
                {showNameDrop && <SuggDrop list={nameSugg} onSelect={autofill}/>}
              </div>
              <div className="relative">
                <label className="text-[10px] text-ink2 uppercase tracking-wider font-semibold block mb-1">Mobile</label>
                <input className="w-full border border-border rounded-md px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  placeholder="98765 43210" value={customerPhone}
                  onChange={e => onPhoneChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPhoneDrop(false), 150)}/>
                {showPhoneDrop && <SuggDrop list={phoneSugg} onSelect={autofill}/>}
              </div>
            </div>
            <input className="w-full border border-border rounded-md px-3 py-2 text-[12px] text-ink outline-none focus:border-accent"
              placeholder="Address note (optional)" value={addressNote} onChange={e => setAddressNote(e.target.value)}/>
          </>
        ) : (
          <Input label="Zomato Order ID" placeholder="ZO-XXXXXXXX" value={zomatoOrderId} onChange={e => setZomatoOrderId(e.target.value)}/>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Select label="Payment" value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)}>
            <option value="cash">Cash</option><option value="upi">UPI</option>
            <option value="card">Card</option>
            {source === 'zomato' && <option value="zomato_pay">Zomato Pay</option>}
          </Select>
          <Input label="Discount Rs." type="number" placeholder="0" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))}/>
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0
          ? <div className="py-10 text-center text-ink3 text-[13px]">Tap menu items to add</div>
          : items.map(ci => (
            <div key={ci.menuItemId} className="border-b border-border px-4 py-2.5">
              <div className="flex items-start gap-2">
                <div className="flex-1 text-[13px] font-semibold text-ink leading-tight">{ci.name}</div>
                <div className="text-[13px] font-bold text-accent whitespace-nowrap">{formatCurrency(ci.unitPrice * ci.quantity, sym)}</div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(ci.menuItemId, -1)} className="w-7 h-7 bg-surface3 border border-border rounded flex items-center justify-center text-ink2 hover:bg-accent hover:text-white hover:border-accent transition-all"><Minus size={12}/></button>
                  <span className="text-[13px] font-bold w-6 text-center">{ci.quantity}</span>
                  <button onClick={() => updateQty(ci.menuItemId, 1)} className="w-7 h-7 bg-surface3 border border-border rounded flex items-center justify-center text-ink2 hover:bg-accent hover:text-white hover:border-accent transition-all"><Plus size={12}/></button>
                </div>
                {editingNote === ci.menuItemId ? (
                  <input autoFocus className="flex-1 min-w-0 bg-surface3 border border-border rounded px-2 py-1 text-[11px] text-ink outline-none focus:border-border2"
                    placeholder="No onion, extra spicy…" value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    onBlur={() => { updateNote(ci.menuItemId, noteInput); setEditingNote(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateNote(ci.menuItemId, noteInput); setEditingNote(null) } }}/>
                ) : ci.note ? (
                  <button onClick={() => { setEditingNote(ci.menuItemId); setNoteInput(ci.note) }}
                    className="flex-1 min-w-0 flex items-center gap-1 bg-orange-50 border border-orange-200 rounded px-2 py-1 text-[11px] text-orange-700 italic hover:bg-orange-100 truncate">
                    <StickyNote size={10}/>{ci.note}
                  </button>
                ) : (
                  <button onClick={() => { setEditingNote(ci.menuItemId); setNoteInput('') }}
                    className="flex-1 min-w-0 flex items-center gap-1 bg-surface3 rounded px-2 py-1 text-[11px] text-ink4 italic hover:text-ink3 border border-transparent hover:border-border">
                    <StickyNote size={10} className="opacity-40"/> Add note…
                  </button>
                )}
                {ci.note && editingNote !== ci.menuItemId && (
                  <button onClick={() => updateNote(ci.menuItemId, '')} className="text-ink4 hover:text-danger"><X size={12}/></button>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* Total + place */}
      <div className="px-4 py-3 border-t border-border bg-surface2 flex-shrink-0">
        {items.length > 0 && (
          <>
            <div className="flex justify-between text-[12px] text-ink3 mb-1"><span>Subtotal</span><span>{formatCurrency(subtotal, sym)}</span></div>
            {discount > 0 && <div className="flex justify-between text-[12px] text-danger mb-1"><span>Discount</span><span>−{formatCurrency(discount, sym)}</span></div>}
            <div className="h-px bg-border my-2"/>
            <div className="flex justify-between font-bold text-ink mb-0"><span className="text-[14px]">Total</span><span className="text-[16px] text-accent">{formatCurrency(total, sym)}</span></div>
          </>
        )}
        <button onClick={handlePlaceOrder} disabled={placing || !items.length}
          className={`mt-3 w-full py-3 rounded-lg font-semibold text-[14px] transition-all shadow-sm ${isViewer ? 'bg-surface3 text-ink3 cursor-not-allowed' : 'bg-accent text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed'}`}>
          {placing ? 'Placing…' : '🖨 Place Order & Print KOT'}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Order">
        <Button variant="ghost" size="sm" icon={<MapPin size={13}/>} onClick={() => setAddrOpen(true)} className="hidden sm:flex">Address Book</Button>
        {/* Mobile cart button */}
        <button onClick={() => setCartOpen(true)}
          className="md:hidden relative bg-accent text-white px-3 py-2 rounded-lg font-semibold text-[12px] flex items-center gap-1.5">
          <ShoppingCart size={14}/>
          {totalQty > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sidebar text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {totalQty}
            </span>
          )}
          Cart {totalQty > 0 ? `(${totalQty})` : ''}
        </button>
      </Topbar>

      {/* Desktop layout */}
      <div className="flex-1 overflow-hidden hidden md:grid grid-cols-[1fr_340px] gap-4 p-4">
        {/* Menu grid */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex gap-1.5 flex-wrap">
            {[{id:'all',name:'All Items',slug:'all'}, ...categories].map((cat: any) => (
              <button key={cat.id} onClick={() => setActiveCat(cat.slug ?? 'all')}
                className={cn('px-3 py-1 rounded-full text-[12px] font-semibold border transition-all',
                  activeCat === (cat.slug ?? 'all') ? 'bg-accent text-white border-accent' : 'bg-white text-ink3 border-border hover:text-ink hover:border-border2')}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-2">
            {filteredItems.map(item => {
              const inCart = items.find(i => i.menuItemId === item.id)
              const price = getPrice(item)
              return (
                <button key={item.id} disabled={!item.is_available}
                  onClick={() => addItem({ menuItemId: item.id, name: item.name, emoji: item.emoji, unitPrice: price, note: '' })}
                  className={cn('relative bg-white border rounded-lg p-2.5 text-left transition-all',
                    item.is_available ? 'cursor-pointer hover:shadow-md hover:-translate-y-px' : 'opacity-35 cursor-not-allowed',
                    inCart ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-border2')}>
                  {inCart && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">{inCart.quantity}</div>}
                  <div className="text-xl mb-1.5">🍔</div>
                  <div className="text-[11.5px] font-semibold text-ink mb-1 leading-tight">{item.name}</div>
                  <div className="text-[12px] font-bold text-accent">{formatCurrency(price, sym)}</div>
                </button>
              )
            })}
          </div>
        </div>
        {/* Desktop order panel */}
        <div className="bg-white border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-sidebar flex-shrink-0">
            <span className="text-white text-[15px] font-bold flex-1">New Order</span>
            <button onClick={() => setAddrOpen(true)} className="text-white/60 hover:text-white"><MapPin size={14}/></button>
          </div>
          <CartContent/>
        </div>
      </div>

      {/* Mobile layout — menu only, cart in drawer */}
      <div className="md:hidden flex-1 overflow-hidden flex flex-col p-3">
        <div className="flex gap-1.5 flex-wrap mb-3">
          {[{id:'all',name:'All',slug:'all'}, ...categories].map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.slug ?? 'all')}
              className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                activeCat === (cat.slug ?? 'all') ? 'bg-accent text-white border-accent' : 'bg-white text-ink3 border-border')}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-4">
          {filteredItems.map(item => {
            const inCart = items.find(i => i.menuItemId === item.id)
            const price = getPrice(item)
            return (
              <button key={item.id} disabled={!item.is_available}
                onClick={() => { addItem({ menuItemId: item.id, name: item.name, emoji: item.emoji, unitPrice: price, note: '' }); }}
                className={cn('relative bg-white border rounded-lg p-3 text-left transition-all active:scale-95',
                  item.is_available ? 'cursor-pointer' : 'opacity-35 cursor-not-allowed',
                  inCart ? 'border-accent ring-1 ring-accent/20' : 'border-border')}>
                {inCart && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full text-[10px] font-bold flex items-center justify-center">{inCart.quantity}</div>}
                <div className="text-2xl mb-2">🍔</div>
                <div className="text-[12px] font-semibold text-ink mb-1 leading-tight">{item.name}</div>
                <div className="text-[13px] font-bold text-accent">{formatCurrency(price, sym)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)}/>
          <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[92vh] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar rounded-t-2xl flex-shrink-0">
              <span className="text-white font-bold text-[15px]">Order Details</span>
              <button onClick={() => setCartOpen(false)} className="text-white/60 hover:text-white p-1"><X size={18}/></button>
            </div>
            <CartContent/>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="Address Book"
        footer={<Button variant="ghost" onClick={() => setAddrOpen(false)}>Close</Button>}>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3"/>
          <input className="w-full border border-border rounded-md pl-8 pr-3 py-2 text-[13px] outline-none focus:border-accent"
            placeholder="Search address or name…" value={addrSearch} onChange={e => setAddrSearch(e.target.value)}/>
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {savedAddresses.filter(a =>
            a.short_code.toLowerCase().includes(addrSearch.toLowerCase()) ||
            (a.primary_name?.toLowerCase().includes(addrSearch.toLowerCase()))
          ).map(a => (
            <button key={a.id} onClick={() => { autofill(a); setAddrOpen(false); setCartOpen(true) }}
              className="w-full flex items-center gap-3 bg-surface2 border border-border rounded-lg p-3 hover:border-accent hover:bg-accent/5 transition-all text-left">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-accent text-[14px]">{a.short_code}</span>
                  {a.primary_name && <span className="text-ink2 text-[12px] truncate">{a.primary_name}</span>}
                </div>
                <div className="flex gap-3 text-[11px] text-ink3">
                  {a.phone && <span>📱 {a.phone}</span>}
                  <span>🧾 {a.order_count} orders</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

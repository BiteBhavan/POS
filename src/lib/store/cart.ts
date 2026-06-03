import { create } from 'zustand'
import type { CartItem, OrderSource, PaymentMode } from '@/types'

interface CartStore {
  items: CartItem[]
  source: OrderSource
  priceList: 'direct' | 'zomato'
  addressShortCode: string
  addressNote: string
  customerPhone: string
  zomatoOrderId: string
  paymentMode: PaymentMode
  discount: number

  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQty: (menuItemId: string, delta: number) => void
  updateNote: (menuItemId: string, note: string) => void
  setSource: (source: OrderSource) => void
  setField: (field: string, value: string | number) => void
  clearCart: () => void
  get subtotal(): number
  get total(): number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [], source: 'direct', priceList: 'direct',
  addressShortCode: '', addressNote: '', customerPhone: '',
  zomatoOrderId: '', paymentMode: 'cash', discount: 0,

  get subtotal() { return get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) },
  get total()    { return Math.max(0, get().subtotal - get().discount) },

  addItem: (item) => set((s) => {
    const existing = s.items.find(i => i.menuItemId === item.menuItemId)
    if (existing) return { items: s.items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i) }
    return { items: [...s.items, { ...item, quantity: 1 }] }
  }),
  removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.menuItemId !== id) })),
  updateQty: (id, delta) => set((s) => ({
    items: s.items.flatMap(i => {
      if (i.menuItemId !== id) return [i]
      const newQty = i.quantity + delta
      return newQty <= 0 ? [] : [{ ...i, quantity: newQty }]
    })
  })),
  updateNote: (id, note) => set((s) => ({ items: s.items.map(i => i.menuItemId === id ? { ...i, note } : i) })),
  setSource: (source) => set({ source, priceList: source === 'zomato' ? 'zomato' : 'direct' }),
  setField: (field, value) => set({ [field]: value } as any),
  clearCart: () => set({ items: [], addressShortCode: '', addressNote: '', customerPhone: '', zomatoOrderId: '', discount: 0 }),
}))

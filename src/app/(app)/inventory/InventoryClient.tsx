"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stockLevel, cn } from '@/lib/utils'
import { Plus, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import type { InventoryItem } from '@/types'

interface InventoryCategory { id: string; name: string; sort_order: number }
interface Props { items: InventoryItem[]; categories: InventoryCategory[] }

export function InventoryClient({ items, categories }: Props) {
  const [activeCat, setActiveCat] = useState('all')
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [purchaseQty, setPurchaseQty] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [purchaseVendor, setPurchaseVendor] = useState('')
  const [newItem, setNewItem] = useState({ name: '', unit: 'pcs', reorder_level: '', cost_per_unit: '', category_id: '' })
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuthStore()
  const isViewer = user?.role === 'viewer'

  const lowStock = items.filter(i => i.current_stock <= i.reorder_level)
  const filtered = activeCat === 'all' ? items : items.filter(i => (i.category as any)?.name === activeCat)

  async function handlePurchase() {
    if (!selectedItem || !purchaseQty) return
    const qty = parseFloat(purchaseQty)
    const cost = parseFloat(purchaseCost) || selectedItem.cost_per_unit
    try {
      await supabase.from('inventory_items')
        .update({ current_stock: selectedItem.current_stock + qty, cost_per_unit: cost }).eq('id', selectedItem.id)
      await supabase.from('stock_transactions').insert({
        inventory_item_id: selectedItem.id, type: 'purchase',
        quantity: qty, cost_per_unit: cost, vendor: purchaseVendor || null,
      })
      toast.success('Stock updated!')
      setPurchaseOpen(false)
      router.refresh()
    } catch { toast.error('Failed to update stock') }
  }

  async function handleAddItem() {
    if (!newItem.name) { toast.error('Name required'); return }
    try {
      await supabase.from('inventory_items').insert({
        name: newItem.name, unit: newItem.unit,
        reorder_level: parseFloat(newItem.reorder_level) || 0,
        cost_per_unit: parseFloat(newItem.cost_per_unit) || 0,
        category_id: newItem.category_id || null,
        current_stock: 0,
      })
      toast.success('Item added!')
      setAddOpen(false)
      router.refresh()
    } catch { toast.error('Failed to add item') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Inventory">
        {!isViewer && <Button variant="ghost" size="sm" icon={<Plus size={13}/>} onClick={() => setAddOpen(true)}>Add Item</Button>}
        {!isViewer && <Button variant="primary" size="sm" icon={<Package size={13}/>} onClick={() => { setSelectedItem(null); setPurchaseOpen(true) }}>Purchase Entry</Button>}
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        {lowStock.length > 0 && (
          <div className="bg-danger/10 border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger flex items-center gap-2 mb-4">
            ⚠️ <strong>Reorder needed:</strong> {lowStock.map(i => i.name).join(' · ')}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap mb-4">
          {['all', ...categories.map(c => c.name)].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={cn('px-3 py-1 rounded-full text-[12px] font-semibold border transition-all',
                activeCat === cat ? 'bg-accent/10 text-accent-light border-accent' : 'bg-surface2 text-ink3 border-border hover:text-ink2')}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map(item => {
            const stock = stockLevel(item.current_stock, item.reorder_level, item.reorder_level * 5)
            const textColors = { good: 'text-success', low: 'text-warn', critical: 'text-danger' }
            return (
              <div key={item.id} className="bg-surface border border-border rounded-md p-3.5">
                <div className="text-[13px] font-semibold text-ink mb-0.5">{item.name}</div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-2.5">{(item.category as any)?.name}</div>
                <div className="h-1 bg-surface3 rounded-full overflow-hidden mb-1.5">
                  <div className={cn('h-full rounded-full transition-all', stock.color)} style={{ width: `${stock.pct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] mb-2">
                  <span className={cn('font-bold', textColors[stock.level as keyof typeof textColors])}>{item.current_stock} {item.unit}</span>
                  <span className="text-ink3">Reorder @ {item.reorder_level}</span>
                </div>
                <div className="text-[11px] text-ink3 mb-2.5">Rs.{item.cost_per_unit} / {item.unit}</div>
                <div className="flex gap-1.5">
                  {!isViewer && (
                    <button onClick={() => { setSelectedItem(item); setPurchaseQty(''); setPurchaseCost(String(item.cost_per_unit)); setPurchaseVendor(''); setPurchaseOpen(true) }}
                      className="flex-1 py-1.5 rounded-md text-[11px] font-semibold bg-surface2 border border-border text-ink3 hover:border-accent hover:text-accent transition-all">
                      + Stock
                    </button>
                  )}
                  <button className="flex-1 py-1.5 rounded-md text-[11px] font-semibold bg-surface2 border border-border text-ink3 hover:border-border2 hover:text-ink2 transition-all">
                    Recipe
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add custom */}
          <button onClick={() => setAddOpen(true)}
            className="bg-surface border border-dashed border-border2 rounded-md p-3.5 flex flex-col items-center justify-center gap-2 text-ink3 hover:border-accent hover:text-accent transition-all min-h-[140px]">
            <Plus size={24} />
            <div className="text-[12px] font-semibold">Add Custom Item</div>
            <div className="text-[11px] text-ink4">Biryani Masala, etc.</div>
          </button>
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} title="📦 Purchase Entry"
        footer={<><Button variant="ghost" onClick={() => setPurchaseOpen(false)}>Cancel</Button><Button variant="primary" onClick={handlePurchase}>Confirm Purchase</Button></>}>
        <div className="space-y-3">
          <Input label="Item Name" value={selectedItem?.name ?? ''} readOnly={!!selectedItem} onChange={() => {}} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" placeholder="0" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} />
            <Input label="Cost per Unit Rs." type="number" placeholder="0" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} />
          </div>
          <Input label="Vendor Name" placeholder="Halal Mart, HP Gas…" value={purchaseVendor} onChange={e => setPurchaseVendor(e.target.value)} />
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="➕ Add Inventory Item"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddItem}>Add Item</Button></>}>
        <div className="space-y-3">
          <Input label="Item Name" placeholder="e.g. Biryani Masala" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={newItem.category_id} onChange={e => setNewItem(p => ({...p, category_id: e.target.value}))}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Unit" value={newItem.unit} onChange={e => setNewItem(p => ({...p, unit: e.target.value}))}>
              {['pcs','kg','litre','grams','rolls','packets'].map(u => <option key={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Reorder Level" type="number" placeholder="0" value={newItem.reorder_level} onChange={e => setNewItem(p => ({...p, reorder_level: e.target.value}))} />
            <Input label="Cost per Unit Rs." type="number" placeholder="0" value={newItem.cost_per_unit} onChange={e => setNewItem(p => ({...p, cost_per_unit: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

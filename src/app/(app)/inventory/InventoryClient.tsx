"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stockLevel, cn } from '@/lib/utils'
import { Plus, Package, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import type { InventoryItem } from '@/types'

interface InventoryCategory { id: string; name: string; sort_order: number }
interface Props { items: InventoryItem[]; categories: InventoryCategory[] }

export function InventoryClient({ items: initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems)
  const [activeCat, setActiveCat] = useState('all')

  // Purchase entry state
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [purchaseQty, setPurchaseQty] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [purchaseVendor, setPurchaseVendor] = useState('')
  const [purchaseItemId, setPurchaseItemId] = useState('') // for dropdown selection

  // Edit quantity state
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [editStock, setEditStock] = useState('')
  const [editReorder, setEditReorder] = useState('')
  const [editCost, setEditCost] = useState('')

  // Add item state
  const [addOpen, setAddOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', unit: 'pcs', reorder_level: '', cost_per_unit: '', category_id: '' })

  // Delete state
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuthStore()
  const isViewer = user?.role === 'viewer'

  const lowStock = items.filter(i => i.current_stock <= i.reorder_level)
  const filtered = activeCat === 'all' ? items : items.filter(i => (i.category as any)?.name === activeCat)

  // ── Purchase Entry ─────────────────────────────────────────────────────
  const purchaseItem = purchaseItemId ? items.find(i => i.id === purchaseItemId) : selectedItem

  async function handlePurchase() {
    if (!purchaseItem || !purchaseQty) { toast.error('Select item and enter quantity'); return }
    const qty = parseFloat(purchaseQty)
    const cost = parseFloat(purchaseCost) || purchaseItem.cost_per_unit
    try {
      const newStock = purchaseItem.current_stock + qty
      await supabase.from('inventory_items')
        .update({ current_stock: newStock, cost_per_unit: cost }).eq('id', purchaseItem.id)
      await supabase.from('stock_transactions').insert({
        inventory_item_id: purchaseItem.id, type: 'purchase',
        quantity: qty, cost_per_unit: cost, vendor: purchaseVendor || null,
      })
      // Update local state
      setItems(prev => prev.map(i => i.id === purchaseItem.id ? { ...i, current_stock: newStock, cost_per_unit: cost } : i))
      toast.success(`${purchaseItem.name} — stock updated to ${newStock} ${purchaseItem.unit}`)
      setPurchaseOpen(false)
      setPurchaseItemId(''); setPurchaseQty(''); setPurchaseCost(''); setPurchaseVendor('')
    } catch { toast.error('Failed to update stock') }
  }

  // ── Edit Item ──────────────────────────────────────────────────────────
  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setEditStock(String(item.current_stock))
    setEditReorder(String(item.reorder_level))
    setEditCost(String(item.cost_per_unit))
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editItem) return
    const newStock = parseFloat(editStock)
    const newReorder = parseFloat(editReorder)
    const newCost = parseFloat(editCost)
    if (isNaN(newStock)) { toast.error('Enter valid stock quantity'); return }
    try {
      await supabase.from('inventory_items').update({
        current_stock: newStock,
        reorder_level: newReorder,
        cost_per_unit: newCost,
      }).eq('id', editItem.id)

      // Log manual adjustment if stock changed
      if (newStock !== editItem.current_stock) {
        await supabase.from('stock_transactions').insert({
          inventory_item_id: editItem.id, type: 'manual_adjustment',
          quantity: newStock - editItem.current_stock,
          notes: `Manual adjustment: ${editItem.current_stock} → ${newStock}`,
        })
      }
      setItems(prev => prev.map(i => i.id === editItem.id
        ? { ...i, current_stock: newStock, reorder_level: newReorder, cost_per_unit: newCost }
        : i
      ))
      toast.success(`${editItem.name} updated!`)
      setEditOpen(false)
    } catch { toast.error('Failed to update') }
  }

  // ── Add Item ───────────────────────────────────────────────────────────
  async function handleAddItem() {
    if (!newItem.name) { toast.error('Name required'); return }
    try {
      const { data, error } = await supabase.from('inventory_items').insert({
        name: newItem.name, unit: newItem.unit,
        reorder_level: parseFloat(newItem.reorder_level) || 0,
        cost_per_unit: parseFloat(newItem.cost_per_unit) || 0,
        category_id: newItem.category_id || null,
        current_stock: 0,
      }).select('*, category:inventory_categories(*)').single()
      if (error) throw error
      setItems(prev => [...prev, data as InventoryItem])
      toast.success('Item added!')
      setAddOpen(false)
      setNewItem({ name: '', unit: 'pcs', reorder_level: '', cost_per_unit: '', category_id: '' })
    } catch { toast.error('Failed to add item') }
  }

  // ── Delete Item ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteItem) return
    try {
      await supabase.from('inventory_items').update({ is_active: false }).eq('id', deleteItem.id)
      setItems(prev => prev.filter(i => i.id !== deleteItem.id))
      toast.success(`${deleteItem.name} removed`)
      setDeleteItem(null)
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Inventory">
        {!isViewer && <Button variant="ghost" size="sm" icon={<Plus size={13}/>} onClick={() => setAddOpen(true)}>Add Item</Button>}
        {!isViewer && <Button variant="primary" size="sm" icon={<Package size={13}/>} onClick={() => { setSelectedItem(null); setPurchaseItemId(''); setPurchaseQty(''); setPurchaseCost(''); setPurchaseVendor(''); setPurchaseOpen(true) }}>Purchase Entry</Button>}
      </Topbar>

      <div className="flex-1 overflow-y-auto p-4">
        {lowStock.length > 0 && (
          <div className="bg-danger/10 border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger flex items-center gap-2 mb-4">
            ⚠️ <strong>Reorder needed:</strong> {lowStock.map(i => i.name).join(' · ')}
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['all', ...categories.map(c => c.name)].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={cn('px-3 py-1 rounded-full text-[12px] font-semibold border transition-all',
                activeCat === cat ? 'bg-accent text-white border-accent' : 'bg-white text-ink3 border-border hover:text-ink2')}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {filtered.map(item => {
            const stock = stockLevel(item.current_stock, item.reorder_level, item.reorder_level * 5)
            const textColor = { good: 'text-success', low: 'text-warn', critical: 'text-danger' }[stock.level] ?? 'text-ink'
            return (
              <div key={item.id} className="bg-white border border-border rounded-lg p-3.5 shadow-sm">
                <div className="flex items-start justify-between mb-0.5">
                  <div className="text-[13px] font-semibold text-ink leading-tight flex-1">{item.name}</div>
                  {!isViewer && (
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => openEdit(item)} className="p-1 text-ink3 hover:text-accent hover:bg-accent/10 rounded transition-all" title="Edit quantity">
                        <Pencil size={12}/>
                      </button>
                      <button onClick={() => setDeleteItem(item)} className="p-1 text-ink3 hover:text-danger hover:bg-danger/10 rounded transition-all" title="Remove item">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-2">{(item.category as any)?.name}</div>

                {/* Stock bar */}
                <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-1.5">
                  <div className={cn('h-full rounded-full transition-all', stock.color)} style={{ width: `${stock.pct}%` }}/>
                </div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className={cn('font-bold', textColor)}>{item.current_stock} {item.unit}</span>
                  <span className="text-ink3">Reorder @ {item.reorder_level}</span>
                </div>
                <div className="text-[11px] text-ink3 mb-2.5">Rs.{item.cost_per_unit} / {item.unit}</div>

                {!isViewer && (
                  <button
                    onClick={() => { setSelectedItem(item); setPurchaseItemId(item.id); setPurchaseQty(''); setPurchaseCost(String(item.cost_per_unit)); setPurchaseVendor(''); setPurchaseOpen(true) }}
                    className="w-full py-1.5 rounded-md text-[11px] font-semibold bg-surface2 border border-border text-ink3 hover:border-accent hover:text-accent transition-all">
                    + Add Stock
                  </button>
                )}
              </div>
            )
          })}

          {!isViewer && (
            <button onClick={() => setAddOpen(true)}
              className="bg-white border border-dashed border-border2 rounded-lg p-3.5 flex flex-col items-center justify-center gap-2 text-ink3 hover:border-accent hover:text-accent transition-all min-h-[160px] shadow-sm">
              <Plus size={24}/>
              <div className="text-[12px] font-semibold">Add Custom Item</div>
              <div className="text-[11px] text-ink4">Biryani Masala, etc.</div>
            </button>
          )}
        </div>
      </div>

      {/* ── PURCHASE ENTRY MODAL ── */}
      <Modal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} title="📦 Purchase Entry"
        footer={<><Button variant="ghost" onClick={() => setPurchaseOpen(false)}>Cancel</Button><Button variant="primary" onClick={handlePurchase}>Confirm Purchase</Button></>}>
        <div className="space-y-3">
          {/* Item dropdown — select from existing items */}
          <div>
            <label className="text-[11px] text-ink2 font-semibold uppercase tracking-wider block mb-1">Select Item *</label>
            <select
              className="w-full bg-white border border-border rounded-md px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              value={purchaseItemId || selectedItem?.id || ''}
              onChange={e => {
                const id = e.target.value
                setPurchaseItemId(id)
                const found = items.find(i => i.id === id)
                if (found) { setSelectedItem(found); setPurchaseCost(String(found.cost_per_unit)) }
              }}>
              <option value="">— Choose item —</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity Purchased *" type="number" placeholder="0" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)}/>
            <Input label="Cost per Unit Rs." type="number" placeholder="0" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)}/>
          </div>
          <Input label="Vendor Name" placeholder="Halal Mart, HP Gas…" value={purchaseVendor} onChange={e => setPurchaseVendor(e.target.value)}/>

          {/* Preview */}
          {purchaseItem && purchaseQty && (
            <div className="bg-success/10 border border-success/20 rounded-md px-3 py-2 text-[12px] text-success">
              ✓ New stock will be: <strong>{purchaseItem.current_stock} + {purchaseQty} = {purchaseItem.current_stock + parseFloat(purchaseQty || '0')} {purchaseItem.unit}</strong>
            </div>
          )}
        </div>
      </Modal>

      {/* ── EDIT QUANTITY MODAL ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`✏️ Edit — ${editItem?.name}`}
        footer={<><Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleEdit}>Save Changes</Button></>}>
        {editItem && (
          <div className="space-y-3">
            <div className="bg-surface2 border border-border rounded-md px-3 py-2 text-[12px] text-ink3 mb-1">
              Current stock: <strong className="text-ink">{editItem.current_stock} {editItem.unit}</strong>
            </div>
            <Input label="Set Stock to (exact quantity) *" type="number" placeholder="0"
              value={editStock} onChange={e => setEditStock(e.target.value)}
              autoFocus/>
            <Input label="Reorder Level" type="number" placeholder="0"
              value={editReorder} onChange={e => setEditReorder(e.target.value)}/>
            <Input label="Cost per Unit Rs." type="number" placeholder="0"
              value={editCost} onChange={e => setEditCost(e.target.value)}/>
            <p className="text-[11px] text-ink3">
              💡 Enter the <strong>exact current quantity</strong> you have right now. E.g. if you counted 19 Veg Tikki, enter 19.
            </p>
          </div>
        )}
      </Modal>

      {/* ── ADD ITEM MODAL ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="➕ Add Inventory Item"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddItem}>Add Item</Button></>}>
        <div className="space-y-3">
          <Input label="Item Name *" placeholder="e.g. Biryani Masala" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))}/>
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
            <Input label="Reorder Level" type="number" placeholder="0" value={newItem.reorder_level} onChange={e => setNewItem(p => ({...p, reorder_level: e.target.value}))}/>
            <Input label="Cost per Unit Rs." type="number" placeholder="0" value={newItem.cost_per_unit} onChange={e => setNewItem(p => ({...p, cost_per_unit: e.target.value}))}/>
          </div>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Remove Inventory Item"
        footer={<><Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Yes, Remove</Button></>}>
        {deleteItem && (
          <div>
            <p className="text-[14px] text-ink mb-3">Remove <strong>{deleteItem.name}</strong> from inventory?</p>
            <div className="bg-surface2 border border-border rounded-md px-3 py-2 text-[12px] space-y-1">
              <div><span className="text-ink3">Current stock: </span><span className="font-medium">{deleteItem.current_stock} {deleteItem.unit}</span></div>
              <div><span className="text-ink3">Category: </span><span className="font-medium">{(deleteItem.category as any)?.name}</span></div>
            </div>
            <div className="mt-3 bg-warn/10 border border-warn/20 rounded-md px-3 py-2 text-[12px] text-warn">
              Item will be hidden from inventory. Historical data is preserved.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

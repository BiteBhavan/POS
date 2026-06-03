"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { MenuItem, MenuCategory } from '@/types'

interface Props { items: MenuItem[]; categories: MenuCategory[] }

export function MenuClient({ items: initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems)
  const [activeCat, setActiveCat] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name:'', emoji:'burger', category_id:'', direct_price:'', zomato_price:'', description:'' })
  const supabase = createClient()
  const router = useRouter()

  const filtered = activeCat === 'all' ? items : items.filter(m => m.category?.slug === activeCat)

  async function toggleAvailability(item: MenuItem) {
    const newVal = !item.is_available
    setItems(prev => prev.map(i => i.id === item.id ? {...i, is_available: newVal} : i))
    await supabase.from('menu_items').update({ is_available: newVal }).eq('id', item.id)
    toast.success(newVal ? `${item.name} available` : `${item.name} unavailable`)
  }

  async function handleSave() {
    if (!form.name || !form.direct_price || !form.zomato_price) { toast.error('Fill required fields'); return }
    try {
      if (editItem) {
        await supabase.from('menu_items').update({
          name: form.name, emoji: form.emoji,
          direct_price: parseFloat(form.direct_price),
          zomato_price: parseFloat(form.zomato_price),
          description: form.description || null,
        }).eq('id', editItem.id)
        toast.success('Item updated!')
      } else {
        await supabase.from('menu_items').insert({
          name: form.name, emoji: form.emoji,
          category_id: form.category_id || null,
          direct_price: parseFloat(form.direct_price),
          zomato_price: parseFloat(form.zomato_price),
          description: form.description || null,
          is_available: true,
        })
        toast.success('Item added to menu!')
      }
      setAddOpen(false); setEditItem(null)
      router.refresh()
    } catch { toast.error('Failed to save') }
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setForm({ name: item.name, emoji: item.emoji, category_id: item.category_id ?? '',
      direct_price: String(item.direct_price), zomato_price: String(item.zomato_price),
      description: item.description ?? '' })
    setAddOpen(true)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Menu Management">
        <Button variant="primary" size="sm" icon={<Plus size={13}/>} onClick={() => { setEditItem(null); setForm({name:'',emoji:'burger',category_id:'',direct_price:'',zomato_price:'',description:''}); setAddOpen(true) }}>
          Add Item
        </Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex gap-1.5 flex-wrap mb-4">
          {[{id:'all',name:'All Items',...{}}, ...categories].map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.slug ?? 'all')}
              className={cn('px-3 py-1 rounded-full text-[12px] font-semibold border transition-all',
                activeCat === (cat.slug ?? 'all') ? 'bg-accent/10 text-accent-light border-accent' : 'bg-surface2 text-ink3 border-border hover:text-ink2')}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map(item => (
            <div key={item.id} className="bg-surface border border-border rounded-md overflow-hidden">
              <div className="p-3.5 border-b border-border">
                <div className="text-[26px] mb-1.5">{item.emoji}</div>
                <div className="text-[13px] font-semibold">{item.name}</div>
                <div className="text-[10px] text-ink3 uppercase tracking-wider font-semibold mb-2.5">{item.category?.name}</div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface2 border border-border rounded-md p-2">
                    <div className="text-[9px] text-ink3 uppercase tracking-wider font-semibold">Direct</div>
                    <div className="text-[14px] font-bold text-accent">Rs.{item.direct_price}</div>
                  </div>
                  <div className="flex-1 bg-surface2 border border-border/60 rounded-md p-2">
                    <div className="text-[9px] text-ink3 uppercase tracking-wider font-semibold">Zomato</div>
                    <div className="text-[14px] font-bold text-danger">Rs.{item.zomato_price}</div>
                  </div>
                </div>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <Toggle checked={item.is_available} onChange={() => toggleAvailability(item)} label={item.is_available ? 'Available' : 'Unavailable'} />
                <button onClick={() => openEdit(item)} className="flex items-center gap-1 text-[11px] text-ink3 hover:text-ink transition-colors bg-surface2 border border-border px-2.5 py-1 rounded-md">
                  <Pencil size={11} /> Edit
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => { setEditItem(null); setForm({name:'',emoji:'burger',category_id:'',direct_price:'',zomato_price:'',description:''}); setAddOpen(true) }}
            className="bg-surface border border-dashed border-border2 rounded-md flex flex-col items-center justify-center gap-2 text-ink3 hover:border-accent hover:text-accent transition-all min-h-[170px] cursor-pointer">
            <Plus size={28} /><div className="text-[13px] font-semibold">Add Item</div>
          </button>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null) }}
        title={editItem ? '✏️ Edit Menu Item' : '🍽️ Add Menu Item'}
        footer={<><Button variant="ghost" onClick={() => { setAddOpen(false); setEditItem(null) }}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editItem ? 'Update' : 'Add Item'}</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <Input label="Item Name *" placeholder="e.g. Spicy Chicken Wings" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
            <Input label="Emoji" placeholder="🍔" value={form.emoji} onChange={e => setForm(p=>({...p,emoji:e.target.value}))} />
          </div>
          {!editItem && (
            <Select label="Category" value={form.category_id} onChange={e => setForm(p=>({...p,category_id:e.target.value}))}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Direct Price Rs. *" type="number" placeholder="0" value={form.direct_price} onChange={e => setForm(p=>({...p,direct_price:e.target.value}))} />
            <Input label="Zomato Price Rs. *" type="number" placeholder="0" value={form.zomato_price} onChange={e => setForm(p=>({...p,zomato_price:e.target.value}))} />
          </div>
          <Input label="Description (optional)" placeholder="Brief description…" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
        </div>
      </Modal>
    </div>
  )
}

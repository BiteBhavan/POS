"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import type { AppSettings, User } from '@/types'
import { Upload } from 'lucide-react'
import Image from 'next/image'

interface Props { settings: AppSettings | null; users: User[] }
const SECTIONS = ['Business Info','Pricing & Commission','Users & Roles','Printer','Backup'] as const

export function SettingsClient({ settings: init, users }: Props) {
  const [activeSection, setActiveSection] = useState<string>('Business Info')
  const [settings, setSettings] = useState(init)
  const [saving, setSaving] = useState(false)
  const [testingPrinter, setTestingPrinter] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name:'', username:'', role:'counter', password:'' })
  const supabase = createClient()
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const isViewer = authUser?.role === 'viewer'

  async function handleSave() {
    if (isViewer) { toast.error('View only access'); return }
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('app_settings').update({
      business_name: settings.business_name,
      fssai_number: settings.fssai_number,
      gst_number: settings.gst_number,
      contact_phone: settings.contact_phone,
      zomato_commission_pct: settings.zomato_commission_pct,
      printer_ip: settings.printer_ip,
      printer_port: settings.printer_port,
    }).eq('id', 1)
    setSaving(false)
    error ? toast.error('Save failed') : toast.success('Settings saved!')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { data, error } = await supabase.storage.from('logos').upload(`logo-${Date.now()}`, file, { upsert: true })
    if (error) { toast.error('Upload failed'); return }
    const { data: url } = supabase.storage.from('logos').getPublicUrl(data.path)
    await supabase.from('app_settings').update({ logo_url: url.publicUrl }).eq('id', 1)
    setSettings(prev => prev ? { ...prev, logo_url: url.publicUrl } : prev)
    toast.success('Logo updated!')
    router.refresh()
  }

  async function handleAddUser() {
    if (!newUser.name || !newUser.username || !newUser.password) { toast.error('Fill all fields'); return }
    try {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: `${newUser.username}@bitebhavan.internal`,
        password: newUser.password, email_confirm: true,
      })
      if (authErr) throw authErr
      await supabase.from('users').insert({ name: newUser.name, username: newUser.username, role: newUser.role as any, auth_id: authData.user.id })
      toast.success('User created!')
      setAddUserOpen(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
  }

  async function testPrinter() {
    setTestingPrinter(true)
    try {
      const res = await fetch('/api/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'test' }) })
      res.ok ? toast.success('Test print sent!') : toast.error('Printer not reachable')
    } catch { toast.error('Printer not reachable') }
    finally { setTestingPrinter(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings">
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>💾 Save Changes</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Nav */}
          <div className="bg-surface border border-border rounded-lg p-3">
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[12px] font-medium transition-all ${activeSection === s ? 'bg-accent/10 text-accent-light' : 'text-ink3 hover:text-ink2 hover:bg-surface2'}`}>
                  {s}
                </button>
              ))}
            </nav>
          </div>

          {/* Panel */}
          <div className="bg-surface border border-border rounded-lg p-5">
            {activeSection === 'Business Info' && settings && (
              <div className="space-y-4">
                <h2 className="font-display text-[17px] mb-5">Business Information</h2>

                {/* Logo upload */}
                <div>
                  <label className="text-[10px] text-ink3 uppercase tracking-wider font-semibold block mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-surface2 border border-border rounded-xl flex items-center justify-center overflow-hidden">
                      {settings.logo_url
                        ? <Image src={settings.logo_url} alt="Logo" width={64} height={64} className="object-contain" />
                        : <span className="text-2xl">🍔</span>}
                    </div>
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-surface2 border border-border text-ink2 px-3 py-2 rounded-md text-[12px] font-semibold hover:border-border2 transition-colors">
                        <Upload size={13} /> Upload Logo
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    <div className="text-[11px] text-ink3">PNG or SVG, max 2MB.<br/>Displays in sidebar & on KOT prints.</div>
                  </div>
                </div>

                <Input label="Business Name" value={settings.business_name} onChange={e => setSettings(p => p ? {...p, business_name: e.target.value} : p)} />
                <Input label="App URL" value="app.bitebhavan.com" readOnly className="text-ink3" />
                <Input label="FSSAI License Number" placeholder="Enter FSSAI number" value={settings.fssai_number ?? ''} onChange={e => setSettings(p => p ? {...p, fssai_number: e.target.value} : p)} />
                <Input label="GST Number (if applicable)" placeholder="22AAAAA0000A1Z5" value={settings.gst_number ?? ''} onChange={e => setSettings(p => p ? {...p, gst_number: e.target.value} : p)} />
                <Input label="Contact Phone" placeholder="98765 43210" value={settings.contact_phone ?? ''} onChange={e => setSettings(p => p ? {...p, contact_phone: e.target.value} : p)} />
              </div>
            )}

            {activeSection === 'Pricing & Commission' && settings && (
              <div className="space-y-4">
                <h2 className="font-display text-[17px] mb-5">Pricing & Commission</h2>
                <div>
                  <Input label="Zomato Commission %" type="number" value={settings.zomato_commission_pct} style={{width:'140px'}}
                    onChange={e => setSettings(p => p ? {...p, zomato_commission_pct: parseFloat(e.target.value)} : p)} />
                  <p className="text-[11px] text-ink3 mt-1.5">Used for P&L and reconciliation reports. Default: 31%</p>
                </div>
                <div className="bg-surface2 border border-border rounded-md p-3 text-[12px] text-ink3">
                  <strong className="text-ink">Pricing logic:</strong> Each menu item has two prices — Direct and Zomato. When creating an order, selecting the source auto-applies the correct price list. No manual override needed.
                </div>
              </div>
            )}

            {activeSection === 'Users & Roles' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-[17px]">Users & Roles</h2>
                  <Button variant="primary" size="sm" onClick={() => setAddUserOpen(true)}>+ Add User</Button>
                </div>
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 bg-surface2 border border-border rounded-md px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-surface3 border border-border2 flex items-center justify-center text-[11px] font-bold text-accent">
                        {u.name.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold">{u.name}</div>
                        <div className="text-[11px] text-ink3">@{u.username}</div>
                      </div>
                      <span className="text-[9px] bg-accent text-[#1a1400] px-2 py-0.5 rounded font-bold uppercase">{u.role}</span>
                      <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-success' : 'bg-danger'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'Printer' && settings && (
              <div className="space-y-4">
                <h2 className="font-display text-[17px] mb-5">Thermal Printer</h2>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input label="Printer IP Address" placeholder="192.168.1.100" value={settings.printer_ip ?? ''}
                      onChange={e => setSettings(p => p ? {...p, printer_ip: e.target.value} : p)} />
                  </div>
                  <Button variant="ghost" size="md" loading={testingPrinter} onClick={testPrinter}>🖨️ Test Print</Button>
                </div>
                <Input label="Port" type="number" value={settings.printer_port} style={{width:'120px'}}
                  onChange={e => setSettings(p => p ? {...p, printer_port: parseInt(e.target.value)} : p)} />
                <div className="bg-surface2 border border-border rounded-md p-3 text-[12px] text-ink3 space-y-1">
                  <p><strong className="text-ink">Setup:</strong> Connect ESC/POS WiFi thermal printer to same network</p>
                  <p>Recommended: GOOJPRT or Xprinter series (₹2,500–4,500 on Amazon)</p>
                  <p>Default port: 9100. Find printer IP from router admin page.</p>
                </div>
              </div>
            )}

            {activeSection === 'Backup' && (
              <div>
                <h2 className="font-display text-[17px] mb-5">Backup & Export</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Export Orders (Excel)', sub: 'All orders with items and notes', action: 'Export Orders' },
                    { label: 'Export Expenses (Excel)', sub: 'Full expense register', action: 'Export Expenses' },
                    { label: 'Export Inventory', sub: 'Current stock levels', action: 'Export Inventory' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between bg-surface2 border border-border rounded-md px-4 py-3">
                      <div>
                        <div className="text-[13px] font-semibold">{item.label}</div>
                        <div className="text-[11px] text-ink3">{item.sub}</div>
                      </div>
                      <Button variant="ghost" size="sm">📥 {item.action}</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={addUserOpen} onClose={() => setAddUserOpen(false)} title="👤 Add New User"
        footer={<><Button variant="ghost" onClick={() => setAddUserOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddUser}>Create User</Button></>}>
        <div className="space-y-3">
          <Input label="Full Name" placeholder="e.g. Raza" value={newUser.name} onChange={e => setNewUser(p=>({...p,name:e.target.value}))} />
          <Input label="Username" placeholder="raza123" value={newUser.username} onChange={e => setNewUser(p=>({...p,username:e.target.value}))} />
          <Select label="Role" value={newUser.role} onChange={e => setNewUser(p=>({...p,role:e.target.value}))}>
            <option value="counter">Counter Staff</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="delivery">Delivery</option>
            <option value="owner">Owner</option>
          </Select>
          <Input label="Password" type="password" placeholder="Min 8 characters" value={newUser.password} onChange={e => setNewUser(p=>({...p,password:e.target.value}))} />
        </div>
      </Modal>
    </div>
  )
}

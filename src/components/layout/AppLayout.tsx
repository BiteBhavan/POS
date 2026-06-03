"use client"
import { useState, createContext, useContext } from 'react'
import { Sidebar } from './Sidebar'
import type { AppSettings } from '@/types'

const MenuCtx = createContext<() => void>(() => {})
export function useMobileMenu() { return useContext(MenuCtx) }

export function AppLayout({ children, settings }: { children: React.ReactNode; settings?: AppSettings }) {
  const [open, setOpen] = useState(false)
  return (
    <MenuCtx.Provider value={() => setOpen(true)}>
      <div className="flex h-screen overflow-hidden bg-bg">
        {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
        <Sidebar
          settings={settings ? { business_name: settings.business_name, logo_url: settings.logo_url } : undefined}
          mobileOpen={open}
          onClose={() => setOpen(false)}
        />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">{children}</main>
      </div>
    </MenuCtx.Provider>
  )
}

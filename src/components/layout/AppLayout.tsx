"use client"
import { Sidebar } from './Sidebar'
import type { AppSettings } from '@/types'

interface AppLayoutProps { children: React.ReactNode; settings?: AppSettings }

export function AppLayout({ children, settings }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar settings={settings ? { business_name: settings.business_name, logo_url: settings.logo_url } : undefined} />
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  )
}

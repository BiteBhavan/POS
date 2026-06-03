import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { redirect } from 'next/navigation'
import type { AppSettings } from '@/types'

export default async function AppRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase.from('app_settings').select('*').single()
  return <AppLayout settings={settings as AppSettings}>{children}</AppLayout>
}

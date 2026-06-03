import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const [settingsRes, usersRes] = await Promise.all([
    supabase.from('app_settings').select('*').single(),
    supabase.from('users').select('*').order('name'),
  ])
  return <SettingsClient settings={settingsRes.data} users={usersRes.data ?? []} />
}

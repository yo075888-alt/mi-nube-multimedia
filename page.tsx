import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <Dashboard email={user.email ?? 'Usuario'} />
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { Profile } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/projects')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as Profile | null} />
      <main className="flex-1 overflow-auto bg-zinc-50">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

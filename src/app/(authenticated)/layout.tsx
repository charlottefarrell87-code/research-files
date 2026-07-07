import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBar from '@/components/layout/NotificationBar'
import { Profile } from '@/types'

async function getLatestFile(service: ReturnType<typeof createServiceClient>) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await service
    .from('research_files')
    .select('id, name, project_id, sub_project_id, created_at, project:projects(name)')
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const latestFile = await getLatestFile(service)

  if (!user) {
    const { data: settings } = await service
      .from('site_settings')
      .select('guest_access_enabled')
      .single()

    if (!settings?.guest_access_enabled) {
      redirect('/login')
    }

    return (
      <div className="flex min-h-screen">
        <Sidebar profile={null} isGuest={true} />
        <div className="flex-1 flex flex-col overflow-auto">
          {latestFile && (
            <NotificationBar
              fileId={latestFile.id}
              fileName={latestFile.name}
              projectName={(latestFile.project as any)?.name ?? ''}
              projectId={latestFile.project_id ?? ''}
              subProjectId={latestFile.sub_project_id}
              uploadedAt={latestFile.created_at}
            />
          )}
          <main className="flex-1">
            <div className="max-w-5xl mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  const { data: profile } = await service
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as Profile | null} isGuest={false} />
      <div className="flex-1 flex flex-col overflow-auto">
        {latestFile && (
          <NotificationBar
            fileId={latestFile.id}
            fileName={latestFile.name}
            projectName={(latestFile.project as any)?.name ?? ''}
            projectId={latestFile.project_id ?? ''}
            subProjectId={latestFile.sub_project_id}
            uploadedAt={latestFile.created_at}
          />
        )}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

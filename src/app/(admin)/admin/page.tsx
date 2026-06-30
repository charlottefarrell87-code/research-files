import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: projectCount }, { count: fileCount }, { data: recentProjects }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('research_files').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('id,name,color,updated_at').order('updated_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Projects', value: projectCount ?? 0, href: '/projects' },
    { label: 'Research Files', value: fileCount ?? 0, href: '/projects' },
  ]

  return (
    <>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage projects, sub-projects, and research files</p>
        </div>
        <Link href="/admin/projects/new" className="btn-primary">New project</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="card p-5 hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-zinc-900">{s.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <section className="card p-6 mb-6">
        <h2 className="text-base font-semibold mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/projects/new" className="btn-secondary justify-center py-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New project
          </Link>
        </div>
      </section>

      {/* Recent projects */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent projects</h2>
          <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700">View all →</Link>
        </div>
        <div className="space-y-2">
          {recentProjects?.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: p.color }}>
                {p.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-400">{formatDate(p.updated_at)}</span>
                <Link href={`/admin/projects/${p.id}/edit`} className="btn-ghost text-xs py-1 px-2">Edit</Link>
                <Link href={`/admin/projects/${p.id}/files/upload`} className="btn-ghost text-xs py-1 px-2">Upload</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

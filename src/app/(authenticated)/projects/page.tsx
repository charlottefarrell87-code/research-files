import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      sub_projects(count),
      research_files(count),
      comments(count)
    `)
    .order('updated_at', { ascending: false })

  return (
    <>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Research Projects</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="text-center py-20 text-zinc-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="text-sm">No projects yet. Ask your UX team to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: Project & { sub_projects: [{count:number}], research_files: [{count:number}], comments: [{count:number}] }) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 hover:shadow-md transition-shadow group block">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-brand-600 transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(p.updated_at)}</p>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{p.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-100 pt-3 mt-auto">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  {p.sub_projects?.[0]?.count ?? 0} sub-projects
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {p.research_files?.[0]?.count ?? 0} files
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {p.comments?.[0]?.count ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

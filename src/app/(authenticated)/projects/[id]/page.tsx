import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import FileList from '@/components/projects/FileList'
import CommentSection from '@/components/comments/CommentSection'

interface PageProps { params: Promise<{ id: string }> }

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('id', id).single(),
  ])

  if (!project) notFound()
  const isAdmin = profile?.role === 'admin'

  const [{ data: subProjects }, { data: files }, { data: comments }] = await Promise.all([
    supabase.from('sub_projects').select('*, research_files(count), comments(count)')
      .eq('project_id', id).order('created_at'),
    supabase.from('research_files').select('*').eq('project_id', id).is('sub_project_id', null).order('created_at'),
    supabase.from('comments').select('*, author:profiles(full_name,email)')
      .eq('project_id', id).is('sub_project_id', null).order('created_at'),
  ])

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/projects" className="hover:text-zinc-600 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium truncate">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-semibold shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.name[0].toUpperCase()}
          </div>
          <div>
            <h1>{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-zinc-500 text-sm max-w-xl">{project.description}</p>
            )}
            <p className="mt-2 text-xs text-zinc-400">Last updated {formatDate(project.updated_at)}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/projects/${id}/edit`} className="btn-secondary text-sm">Edit</Link>
            <Link href={`/admin/projects/${id}/files/upload`} className="btn-primary text-sm">Upload file</Link>
            <Link href={`/admin/projects/${id}/sub-projects/new`} className="btn-secondary text-sm">Add sub-project</Link>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Project-level files */}
        {((files && files.length > 0) || isAdmin) && (
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Project Files</h2>
              {isAdmin && (
                <Link href={`/admin/projects/${id}/files/upload`} className="btn-ghost text-xs">
                  + Add file
                </Link>
              )}
            </div>
            <FileList files={files ?? []} isAdmin={isAdmin} />
          </section>
        )}

        {/* Sub-projects */}
        {subProjects && subProjects.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Sub-Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subProjects.map((sp: any) => (
                <Link
                  key={sp.id}
                  href={`/projects/${id}/${sp.id}`}
                  className="card p-4 hover:shadow-md transition-shadow group block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-zinc-900 group-hover:text-brand-600 transition-colors">
                        {sp.name}
                      </h3>
                      {sp.description && (
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{sp.description}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-zinc-300 group-hover:text-brand-400 shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-zinc-400">
                    <span>{sp.research_files?.[0]?.count ?? 0} files</span>
                    <span>{sp.comments?.[0]?.count ?? 0} comments</span>
                    <span>{formatDate(sp.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <section className="card p-6">
          <CommentSection
            comments={comments ?? []}
            projectId={id}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </>
  )
}

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import FileList from '@/components/projects/FileList'
import CommentSection from '@/components/comments/CommentSection'

interface PageProps { params: Promise<{ id: string; subId: string }> }

export default async function SubProjectPage({ params }: PageProps) {
  const { id, subId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: subProject }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('projects').select('id,name,color').eq('id', id).single(),
    supabase.from('sub_projects').select('*').eq('id', subId).single(),
  ])

  if (!project || !subProject) notFound()
  const isAdmin = profile?.role === 'admin'

  const [{ data: files }, { data: comments }] = await Promise.all([
    supabase.from('research_files').select('*').eq('sub_project_id', subId).order('created_at'),
    supabase.from('comments').select('*, author:profiles(full_name,email)')
      .eq('sub_project_id', subId).order('created_at'),
  ])

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/projects" className="hover:text-zinc-600 transition-colors">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-zinc-600 transition-colors">{project.name}</Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium truncate">{subProject.name}</span>
      </nav>

      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-semibold shrink-0 opacity-60"
            style={{ backgroundColor: project.color }}
          >
            {subProject.name[0].toUpperCase()}
          </div>
          <div>
            <h1>{subProject.name}</h1>
            {subProject.description && (
              <p className="mt-1 text-zinc-500 text-sm max-w-xl">{subProject.description}</p>
            )}
            <p className="mt-2 text-xs text-zinc-400">Last updated {formatDate(subProject.updated_at)}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/projects/${id}/files/upload?sub=${subId}`} className="btn-primary text-sm">
              Upload file
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Files */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Files</h2>
            {isAdmin && (
              <Link href={`/admin/projects/${id}/files/upload?sub=${subId}`} className="btn-ghost text-xs">
                + Add file
              </Link>
            )}
          </div>
          <FileList files={files ?? []} isAdmin={isAdmin} />
        </section>

        {/* Comments */}
        <section className="card p-6">
          <CommentSection
            comments={comments ?? []}
            subProjectId={subId}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </>
  )
}

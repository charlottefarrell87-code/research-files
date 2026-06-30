'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewSubProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => setProjectName(data?.name ?? ''))
  }, [projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('sub_projects').insert({
      project_id: projectId,
      name: name.trim(),
      description: description.trim() || null,
      created_by: user?.id,
    })
    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/projects/${projectId}`)
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/admin" className="hover:text-zinc-600">Admin</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-zinc-600">{projectName || 'Project'}</Link>
        <span>/</span>
        <span className="text-zinc-900">New sub-project</span>
      </nav>

      <div className="page-header">
        <h1>Add sub-project</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Group related research within <strong>{projectName}</strong>.
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Sub-project name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="e.g. Participant Interviews – Q2"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input resize-none"
              placeholder="What research does this sub-project cover?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary">
              {saving ? 'Creating…' : 'Create sub-project'}
            </button>
            <Link href={`/projects/${projectId}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  )
}

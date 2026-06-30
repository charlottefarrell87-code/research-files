'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_COLORS } from '@/lib/utils'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setName(data.name)
        setDescription(data.description ?? '')
        setColor(data.color)
      }
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .update({ name: name.trim(), description: description.trim() || null, color })
      .eq('id', id)
    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/projects/${id}`)
  }

  async function handleDelete() {
    if (!confirm('Delete this project and all its files and sub-projects? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', id)
    router.push('/projects')
  }

  if (loading) return <div className="text-sm text-zinc-400 py-12 text-center">Loading…</div>

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/admin" className="hover:text-zinc-600">Admin</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-zinc-600">Project</Link>
        <span>/</span>
        <span className="text-zinc-900">Edit</span>
      </nav>

      <div className="page-header">
        <h1>Edit project</h1>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Project name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label">Project colour</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link href={`/projects/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-100">
        <h2 className="text-base font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Permanently delete this project including all sub-projects, files, and comments.
        </p>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger text-sm">
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>
      </div>
    </>
  )
}

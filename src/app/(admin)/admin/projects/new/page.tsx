'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_COLORS } from '@/lib/utils'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description: description.trim() || null, color, created_by: user?.id })
      .select('id')
      .single()
    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/projects/${data.id}`)
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/admin" className="hover:text-zinc-600">Admin</Link>
        <span>/</span>
        <span className="text-zinc-900">New project</span>
      </nav>

      <div className="page-header">
        <h1>Create project</h1>
        <p className="mt-1 text-sm text-zinc-500">Set up a new research project to house your files and sub-projects.</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Project name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="e.g. Mobile Onboarding Research"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input resize-none"
              placeholder="Brief description of the research focus…"
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

          {name && (
            <div className="rounded-lg bg-zinc-50 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                style={{ backgroundColor: color }}>
                {name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{name}</p>
                {description && <p className="text-xs text-zinc-400 truncate">{description}</p>}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary">
              {saving ? 'Creating…' : 'Create project'}
            </button>
            <Link href="/admin" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  )
}

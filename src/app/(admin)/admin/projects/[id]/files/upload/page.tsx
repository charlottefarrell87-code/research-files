'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type UploadMode = 'html_upload' | 'external_link'

export default function UploadFilePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const subProjectId = searchParams.get('sub')

  const [mode, setMode] = useState<UploadMode>('html_upload')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [subProjectName, setSubProjectName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => setProjectName(data?.name ?? ''))
    if (subProjectId) {
      supabase.from('sub_projects').select('name').eq('id', subProjectId).single()
        .then(({ data }) => setSubProjectName(data?.name ?? ''))
    }
  }, [projectId, subProjectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (mode === 'html_upload' && !file) return
    if (mode === 'external_link' && !externalUrl.trim()) return

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let storagePath: string | null = null

    if (mode === 'html_upload' && file) {
      const ext = file.name.split('.').pop()
      const path = `${projectId}/${subProjectId ?? 'root'}/${Date.now()}-${name.trim().replace(/\s+/g, '-')}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('research-files')
        .upload(path, file, { contentType: file.type })
      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }
      storagePath = path
    }

    const { error: insertError } = await supabase.from('research_files').insert({
      project_id: projectId,
      sub_project_id: subProjectId ?? null,
      name: name.trim(),
      description: description.trim() || null,
      file_type: mode,
      storage_path: storagePath,
      external_url: mode === 'external_link' ? externalUrl.trim() : null,
      created_by: user?.id,
    })

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
      return
    }

    const dest = subProjectId
      ? `/projects/${projectId}/${subProjectId}`
      : `/projects/${projectId}`
    router.push(dest)
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6 flex-wrap">
        <Link href="/admin" className="hover:text-zinc-600">Admin</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-zinc-600">{projectName || 'Project'}</Link>
        {subProjectId && (
          <>
            <span>/</span>
            <Link href={`/projects/${projectId}/${subProjectId}`} className="hover:text-zinc-600">
              {subProjectName || 'Sub-project'}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-900">Add file</span>
      </nav>

      <div className="page-header">
        <h1>Add research file</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload an HTML report or link to an external resource.
        </p>
      </div>

      <div className="card p-6">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg mb-6 w-fit">
          {(['html_upload', 'external_link'] as UploadMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {m === 'html_upload' ? 'Upload HTML file' : 'External link'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">File name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder={mode === 'html_upload' ? 'e.g. Usability Test Report – Round 3' : 'e.g. Miro Workshop Board'}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input resize-none"
              placeholder="Optional notes about this file…"
            />
          </div>

          {mode === 'html_upload' ? (
            <div>
              <label className="label">HTML file <span className="text-red-500">*</span></label>
              <div className={`mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-brand-300 bg-brand-50' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
              }`}>
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-brand-700">{file.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button type="button" onClick={() => setFile(null)} className="mt-3 text-xs text-zinc-400 hover:text-zinc-600">
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-zinc-500">Drop an HTML file here, or click to browse</p>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      style={{ position: 'relative' }}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="label">URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                required
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                className="input"
                placeholder="https://miro.com/app/board/…"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Link to Miro, Notion, Google Docs, FigJam, Maze, or any other tool.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading || !name.trim() || (mode === 'html_upload' && !file) || (mode === 'external_link' && !externalUrl.trim())}
              className="btn-primary"
            >
              {uploading ? 'Uploading…' : 'Add file'}
            </button>
            <Link
              href={subProjectId ? `/projects/${projectId}/${subProjectId}` : `/projects/${projectId}`}
              className="btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}

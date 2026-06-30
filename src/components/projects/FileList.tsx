'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ResearchFile } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface FileListProps {
  files: ResearchFile[]
  projectId: string
  isAdmin?: boolean
  onDeleted?: (id: string) => void
}

export default function FileList({ files: initialFiles, projectId, isAdmin, onDeleted }: FileListProps) {
  const [files, setFiles] = useState(initialFiles)

  async function handleDelete(file: ResearchFile) {
    if (!confirm(`Delete "${file.name}"?`)) return
    const supabase = createClient()
    if (file.storage_path) {
      await supabase.storage.from('research-files').remove([file.storage_path])
    }
    await supabase.from('research_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
    onDeleted?.(file.id)
  }

  if (files.length === 0) {
    return <p className="text-sm text-zinc-400 py-4">No files attached yet.</p>
  }

  return (
    <div className="space-y-2">
      {files.map(file => (
        <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:border-zinc-200 bg-white transition-colors group">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            file.file_type === 'html_upload'
              ? 'bg-brand-50 text-brand-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {file.file_type === 'html_upload' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{file.name}</p>
            {file.description && (
              <p className="text-xs text-zinc-400 truncate">{file.description}</p>
            )}
            <p className="text-xs text-zinc-300 mt-0.5">{formatDateTime(file.created_at)}</p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/projects/${projectId}/file/${file.id}`}
              className="btn-ghost text-xs py-1 px-2"
            >
              Open
            </Link>
            {isAdmin && (
              <button
                onClick={() => handleDelete(file)}
                className="btn-ghost text-xs py-1 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Comment, Profile } from '@/types'
import { formatDateTime, getInitials } from '@/lib/utils'

interface CommentSectionProps {
  comments: (Comment & { author: Pick<Profile, 'full_name' | 'email'> | null })[]
  projectId?: string
  subProjectId?: string
  currentUserId: string
  isAdmin: boolean
}

export default function CommentSection({
  comments: initialComments,
  projectId,
  subProjectId,
  currentUserId,
  isAdmin,
}: CommentSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({
        body: body.trim(),
        project_id: projectId ?? null,
        sub_project_id: subProjectId ?? null,
        author_id: currentUserId,
      })
      .select('*, author:profiles(full_name,email)')
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data as Comment & { author: Pick<Profile,'full_name'|'email'> | null }])
      setBody('')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  async function handleEdit(id: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .update({ body: editBody.trim() })
      .eq('id', id)
      .select('*, author:profiles(full_name,email)')
      .single()
    if (data) {
      setComments(prev => prev.map(c => c.id === id ? data as Comment & { author: Pick<Profile,'full_name'|'email'> | null } : c))
    }
    setEditingId(null)
  }

  return (
    <div>
      <h3 className="font-semibold text-zinc-900 mb-4">
        Comments <span className="text-zinc-400 font-normal">({comments.length})</span>
      </h3>

      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-zinc-400 py-4 text-center">No comments yet. Be the first!</p>
        )}
        {comments.map(c => {
          const name = c.author?.full_name ?? c.author?.email ?? 'Unknown'
          const canModify = currentUserId === c.author_id || isAdmin
          return (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                {getInitials(c.author?.full_name ?? null, c.author?.email ?? '?')}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-900">{name}</span>
                  <span className="text-xs text-zinc-400">{formatDateTime(c.created_at)}</span>
                  {c.updated_at !== c.created_at && (
                    <span className="text-xs text-zinc-300">(edited)</span>
                  )}
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="input text-sm resize-none"
                      rows={3}
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c.id)} className="btn-primary text-xs py-1 px-3">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{c.body}</p>
                    {canModify && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingId(c.id); setEditBody(c.body) }}
                          className="text-xs text-zinc-400 hover:text-zinc-600 px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors"
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs text-zinc-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          className="input text-sm resize-none flex-1"
          rows={2}
          placeholder="Leave a comment…"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button type="submit" disabled={submitting || !body.trim()} className="btn-primary self-end">
          Post
        </button>
      </form>
    </div>
  )
}

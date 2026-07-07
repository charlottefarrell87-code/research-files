'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { friendlyError } from '@/lib/errors'

export default function SiteSettingsPage() {
  const [guestAccess, setGuestAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('site_settings')
      .select('guest_access_enabled')
      .single()
      .then(({ data }) => {
        setGuestAccess(data?.guest_access_enabled ?? false)
        setLoading(false)
      })
  }, [])

  async function handleToggle() {
    const next = !guestAccess
    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('site_settings')
      .update({ guest_access_enabled: next, updated_at: new Date().toISOString() })
      .eq('id', true)

    if (error) {
      setMessage({ type: 'error', text: friendlyError(error.message) })
    } else {
      setGuestAccess(next)
      setMessage({
        type: 'success',
        text: next
          ? 'Guest access is now on. Anyone with the link can browse the site.'
          : 'Guest access is off. Users must sign in to view anything.',
      })
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-sm text-zinc-400 py-12 text-center">Loading…</div>
  }

  return (
    <>
      <div className="page-header">
        <h1>Site settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Control access and visibility for the Research Hub.</p>
      </div>

      <div className="card p-6 max-w-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Guest access</h2>
            <p className="mt-1 text-sm text-zinc-500">
              When on, anyone with the site URL can browse all projects and open files without signing in.
              They cannot comment or manage anything.
            </p>
          </div>

          {/* Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={guestAccess}
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
              guestAccess ? 'bg-brand-600' : 'bg-zinc-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                guestAccess ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${
          guestAccess ? 'text-green-700' : 'text-zinc-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${guestAccess ? 'bg-green-500' : 'bg-zinc-300'}`} />
          {guestAccess ? 'Guest access is on' : 'Guest access is off'}
        </div>

        {message && (
          <p className={`mt-4 text-sm px-3 py-2 rounded-lg border ${
            message.type === 'success'
              ? 'text-green-700 bg-green-50 border-green-100'
              : 'text-red-600 bg-red-50 border-red-100'
          }`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="mt-6 card p-5 max-w-lg bg-zinc-50 border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-700 mb-1">How to share</h3>
        <p className="text-sm text-zinc-500">
          Turn on guest access, then share your site URL:{' '}
          <span className="font-mono text-xs bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-700">
            research-files.vercel.app
          </span>
        </p>
        <p className="text-sm text-zinc-500 mt-2">
          Guests will see all projects and can open files, but will be prompted to sign in if they want to comment.
        </p>
      </div>
    </>
  )
}

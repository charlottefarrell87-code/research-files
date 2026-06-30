'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setStatus('error')
      setMessage('Password must be at least 8 characters.')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setStatus('error')
      setMessage('Could not verify your session. Please sign out and back in.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setStatus('error')
      setMessage('Current password is incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Account settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Update your password.</p>
      </div>

      <div className="card p-6 max-w-md">
        <h2 className="text-base font-semibold mb-5">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              minLength={8}
            />
            <p className="mt-1 text-xs text-zinc-400">Minimum 8 characters.</p>
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </div>

          {message && (
            <p className={`text-sm px-3 py-2 rounded-lg border ${
              status === 'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}>
              {message}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary"
            >
              {status === 'loading' ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

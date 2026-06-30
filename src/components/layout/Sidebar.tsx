'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  {
    label: 'Projects',
    href: '/projects',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
]

const adminItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'New Project',
    href: '/admin/projects/new',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    const active = pathname === href || (href !== '/projects' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-brand-50 text-brand-700'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        <span className={active ? 'text-brand-600' : 'text-zinc-400'}>{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-zinc-200 bg-white h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-100">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="font-semibold text-zinc-900 text-sm">Research Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="section-title px-3">Browse</p>
        {navItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {isAdmin && (
          <>
            <p className="section-title px-3 mt-6">Admin</p>
            {adminItems.map(item => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(profile?.full_name ?? null, profile?.email ?? '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {profile?.full_name ?? profile?.email}
            </p>
            <p className="text-xs text-zinc-400 truncate capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

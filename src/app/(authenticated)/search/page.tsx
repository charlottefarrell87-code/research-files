import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface PageProps { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const supabase = await createClient()

  let projectResults: any[] = []
  let fileResults: any[] = []

  if (query) {
    const [{ data: projects }, { data: files }] = await Promise.all([
      supabase
        .from('projects')
        .select('id,name,description,color,updated_at')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('research_files')
        .select('id,name,description,file_type,project_id,sub_project_id,created_at')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    projectResults = projects ?? []
    fileResults = files ?? []
  }

  const total = projectResults.length + fileResults.length

  return (
    <>
      <div className="page-header">
        <h1>Search</h1>
        <p className="mt-1 text-sm text-zinc-500">Search across projects and research files</p>
      </div>

      <form method="GET" className="mb-8 flex gap-3 max-w-xl">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search projects, files…"
          className="input flex-1"
          autoFocus
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {query && (
        <div>
          <p className="text-sm text-zinc-500 mb-6">
            {total} result{total !== 1 ? 's' : ''} for &ldquo;<strong className="text-zinc-900">{query}</strong>&rdquo;
          </p>

          {projectResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-zinc-500 mb-3">Projects</h2>
              <div className="space-y-2">
                {projectResults.map((p: any) => (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group block">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold shrink-0"
                      style={{ backgroundColor: p.color }}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 group-hover:text-brand-600 transition-colors">
                        {p.name}
                      </p>
                      {p.description && <p className="text-xs text-zinc-400 truncate">{p.description}</p>}
                    </div>
                    <span className="text-xs text-zinc-300">{formatDate(p.updated_at)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {fileResults.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 mb-3">Files</h2>
              <div className="space-y-2">
                {fileResults.map((f: any) => (
                  <Link
                    key={f.id}
                    href={f.sub_project_id ? `/projects/${f.project_id}/${f.sub_project_id}` : `/projects/${f.project_id}`}
                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group block"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      f.file_type === 'html_upload' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 group-hover:text-brand-600 transition-colors">
                        {f.name}
                      </p>
                      {f.description && <p className="text-xs text-zinc-400 truncate">{f.description}</p>}
                    </div>
                    <span className="text-xs text-zinc-300">{formatDate(f.created_at)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {total === 0 && (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Try a different search term.</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

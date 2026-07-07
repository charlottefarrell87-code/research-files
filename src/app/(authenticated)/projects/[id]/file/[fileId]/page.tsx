import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface PageProps {
  params: Promise<{ id: string; fileId: string }>
}

type ViewMode = 'html' | 'pdf' | 'office' | 'external' | null

const OFFICE_EXTS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']

export default async function FileViewerPage({ params }: PageProps) {
  const { id, fileId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Auth handled by layout — guests allowed when guest_access_enabled

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: file } = await service
    .from('research_files')
    .select('*, project:projects(name), sub_project:sub_projects(name, id)')
    .eq('id', fileId)
    .single()

  if (!file) notFound()

  let fileUrl: string | null = null
  let htmlContent: string | null = null
  let viewMode: ViewMode = null

  if (file.file_type === 'html_upload' && file.storage_path) {
    const ext = file.storage_path.split('.').pop()?.toLowerCase() ?? ''

    if (!ext || ext === 'html' || ext === 'htm') {
      viewMode = 'html'
      const { data } = await service.storage
        .from('research-files')
        .download(file.storage_path)
      if (data) {
        let content = await data.text()
        // Force all links to open in a new tab
        if (/<head/i.test(content)) {
          content = content.replace(/(<head[^>]*>)/i, '$1<base target="_blank">')
        } else {
          content = '<base target="_blank">' + content
        }
        htmlContent = content
      }
    } else if (ext === 'pdf') {
      viewMode = 'pdf'
      const { data } = await service.storage
        .from('research-files')
        .createSignedUrl(file.storage_path, 3600)
      fileUrl = data?.signedUrl ?? null
    } else if (OFFICE_EXTS.includes(ext)) {
      viewMode = 'office'
      const { data } = await service.storage
        .from('research-files')
        .createSignedUrl(file.storage_path, 3600)
      if (data?.signedUrl) {
        fileUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.signedUrl)}`
      }
    }
  } else if (file.file_type === 'external_link' && file.external_url) {
    redirect(file.external_url)
  }

  const backHref = file.sub_project_id
    ? `/projects/${id}/${file.sub_project_id}`
    : `/projects/${id}`

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 h-12 border-b border-zinc-200 bg-white shrink-0 z-10">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-zinc-400 truncate">{file.project?.name}</span>
          {file.sub_project && (
            <>
              <span className="text-zinc-300 text-xs">/</span>
              <span className="text-xs text-zinc-400 truncate">{file.sub_project.name}</span>
            </>
          )}
          <span className="text-zinc-300 text-xs">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate">{file.name}</span>
        </div>
        {viewMode === 'external' && fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-brand-600 hover:text-brand-700 shrink-0"
          >
            Open in new tab ↗
          </a>
        )}
        {viewMode === 'office' && (
          <span className="ml-auto text-xs text-zinc-400 shrink-0">Powered by Microsoft Office Online</span>
        )}
      </div>

      {/* Content */}
      {viewMode === 'html' && htmlContent ? (
        <iframe
          srcDoc={htmlContent}
          className="flex-1 w-full border-0"
          title={file.name}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
        />
      ) : (viewMode === 'pdf' || viewMode === 'office') && fileUrl ? (
        <iframe
          src={fileUrl}
          className="flex-1 w-full border-0"
          title={file.name}
        />
      ) : viewMode === 'external' && fileUrl ? (
        /* External links can't be iframed — most sites block embedding */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">{file.name}</h2>
            <p className="text-sm text-zinc-500 mb-6 break-all">{fileUrl}</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Open link
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          Could not load file.
        </div>
      )}
    </div>
  )
}

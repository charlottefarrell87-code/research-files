import { notFound } from 'next/navigation'
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
  } else if (file.file_type === 'external_link') {
    viewMode = 'external'
    fileUrl = file.external_url
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
      ) : (viewMode === 'pdf' || viewMode === 'office' || viewMode === 'external') && fileUrl ? (
        <iframe
          src={fileUrl}
          className="flex-1 w-full border-0"
          title={file.name}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          Could not load file.
        </div>
      )}
    </div>
  )
}

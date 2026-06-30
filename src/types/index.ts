export type UserRole = 'admin' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string | null
  created_at: string
  updated_at: string
  // joined fields
  sub_projects?: SubProject[]
  research_files?: ResearchFile[]
  comment_count?: number
  file_count?: number
}

export interface SubProject {
  id: string
  project_id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  research_files?: ResearchFile[]
  comment_count?: number
  file_count?: number
}

export type FileType = 'html_upload' | 'external_link'

export interface ResearchFile {
  id: string
  project_id: string | null
  sub_project_id: string | null
  name: string
  description: string | null
  file_type: FileType
  storage_path: string | null
  external_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  uploader?: Pick<Profile, 'full_name' | 'email'>
}

export interface Comment {
  id: string
  project_id: string | null
  sub_project_id: string | null
  author_id: string
  body: string
  created_at: string
  updated_at: string
  // joined
  author?: Pick<Profile, 'full_name' | 'email'>
}

# Research Hub — Setup & Deployment Guide

## What you're getting

A full-stack web application for your UX team to manage and share research. Built with:

- **Next.js 14** (App Router) — the web framework
- **Supabase** — auth, database (PostgreSQL), and file storage (all free to start)
- **Tailwind CSS** — styling
- **Vercel** — recommended hosting (free tier available)

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / sign in.
2. Click **New project**, give it a name (e.g. `research-hub`), set a database password, choose a region close to your team.
3. Wait ~1 minute for the project to spin up.

### Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**.
2. Copy the entire contents of `supabase/schema.sql` in this project.
3. Paste it into the SQL Editor and click **Run**.

### Create the storage bucket

1. In Supabase, go to **Storage** → **New bucket**.
2. Name it exactly: `research-files`
3. Set it to **Private** (not public).
4. Click **Create bucket**.

### Get your API keys

In your Supabase dashboard go to **Settings → API**. You'll need:

- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon (public) key** — safe to expose in the browser
- **service_role key** — keep this secret, server-side only

---

## 2. Set up the app locally

```bash
# Install dependencies
npm install

# Copy the env file and fill in your Supabase keys
cp .env.local.example .env.local
```

Open `.env.local` and paste in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## 3. Invite your team

Everyone needs a Supabase account in your project. Add them via **Authentication → Users → Invite user** in the Supabase dashboard. They'll receive an email to set a password.

### Roles

By default every new user gets the `viewer` role (can browse, search, comment — but not upload or edit).

To make someone an **admin** (UX team member who can create projects and upload files):

1. In Supabase, go to **Table Editor → profiles**.
2. Find the user's row and change their `role` from `viewer` to `admin`.

---

## 4. Deploy to Vercel (recommended)

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. During setup, add the three environment variables from `.env.local`.
4. Click **Deploy**.

Your site will be live at `https://your-project.vercel.app`. Share that URL with your team — they'll log in with the credentials you set up in Supabase Auth.

---

## 5. Day-to-day usage

### As an admin (UX team)

| Task | Where |
|------|-------|
| Create a new project | Admin → New project |
| Add a sub-project | Open a project → "Add sub-project" button |
| Upload an HTML file | Open a project → "Upload file" button |
| Link to an external resource (Miro, Notion, etc.) | Upload file → switch to "External link" tab |
| Edit a project name / colour | Open project → "Edit" button |
| Delete a file | Hover a file row → "Delete" |
| Delete a project | Edit project → Danger zone |

### As a viewer (design / product team)

| Task | Where |
|------|-------|
| Browse all projects | Projects page (sidebar) |
| Find specific research | Search page (sidebar) |
| Open a file | Hover a file → "Open" |
| Leave a comment | Scroll to comments on any project / sub-project |

---

## 6. Connecting your Figma styles

You shared a Figma file (`Design.md`) but access was restricted. Once you share it with edit access:

1. The colours, typography, and spacing can be pulled directly into `src/app/globals.css` and `tailwind.config.ts`.
2. Current colour palette is indigo-based (`#6366f1`) — easy to swap out in one place.

---

## Project structure (quick reference)

```
src/
  app/
    login/               — Login page
    (authenticated)/     — Pages all logged-in users see
      projects/          — Browse & project detail
      search/            — Full-text search
    (admin)/             — Admin-only pages
      admin/
        projects/new/    — Create project
        projects/[id]/   — Edit, upload files, add sub-projects
  components/
    layout/Sidebar.tsx   — Navigation + user menu
    projects/FileList.tsx — File listing with open/delete
    comments/CommentSection.tsx — Comments with edit/delete
  lib/supabase/          — Supabase client helpers
  types/                 — TypeScript types
supabase/schema.sql      — Full database schema + RLS policies
```

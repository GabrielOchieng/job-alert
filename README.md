# Job Alert App

An automated job tracking dashboard and job discovery tool for frontend engineers, powered by Next.js, React, Supabase, and AI integrations. This app aggregates remote job listings from multiple sources, filters for global opportunities, and provides tools for tracking, applying, and tailoring your application materials.

---

## Features

- **Automated Job Aggregation:** Fetches jobs from APIs (Himalayas, Remotive, RemoteOK, WeWorkRemotely, etc.) and RSS feeds.
- **Global Filtering:** Filters out region-locked jobs, surfacing only worldwide/remote-friendly roles.
- **Job Tracking Dashboard:** Track job statuses (new, applied, etc.) and manage your job search pipeline.
- **AI-Powered Cover Letters:** Generate tailored cover letters using your resume and job descriptions via Google Gemini/AI SDK.
- **Resume Tailoring:** Extract and update your resume text for personalized applications.
- **Modern UI:** Built with React, Next.js App Router, Tailwind CSS, and shadcn/ui components.
- **Supabase Integration:** Stores job data, user profiles, and application history securely.

---

## Architecture Overview

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
- **Backend/API:** Next.js API routes for job fetching, AI cover letter generation, and resume extraction
- **Database:** Supabase (PostgreSQL)
- **AI Integrations:** Google Gemini, Firecrawl, Mendable, Resend (email)
- **Job Sources:** Himalayas, Remotive, RemoteOK, WeWorkRemotely, NoDesk, JSearch, and more

---

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd job-alert-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your Supabase, API, and AI keys.

4. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

- **Dashboard:** View and filter job leads, update application statuses, and explore job details.
- **Profile Modal:** Upload or update your resume (PDF extraction supported).
- **Tailor Resume:** Use the AI-powered modal to generate custom cover letters for each job.
- **Automated Scouts:** Background scripts and API routes fetch and filter jobs on a schedule (see `src/app/api/cron/`).

---

## Scripts & API Endpoints

- **Job Fetchers:**
  - `src/app/api/cron/global/route.ts` — Aggregates jobs from APIs (Himalayas, Remotive, etc.)
  - `src/app/api/cron/rss/route.ts` — Fetches jobs from RSS feeds
  - `src/app/api/cron/api/route.ts` — Fetches jobs from JSearch API
  - `src/app/api/jobs/ai-scout/route.ts` — AI-powered job scraping and enrichment
- **Cover Letter Generator:**
  - `src/app/api/cover-letter/route.ts` — Generates tailored cover letters using AI
- **Resume Extraction:**
  - `src/app/api/extract-pdf/route.ts` — Extracts text from uploaded PDF resumes

---

## Customization & Extending

- **Add new job sources:** Update the relevant API route or script in `src/app/api/cron/` or `scripts/`.
- **Modify filters:** Adjust `src/lib/filters.ts` to change red/green flag logic for job locations.
- **UI Components:** Located in `src/components/` and `src/components/ui/`.

---

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss major changes.

---

## License

MIT

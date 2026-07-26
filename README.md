<div align="center">

<img src="public/logo.jpg" alt="AttendIQ Logo" width="140" style="border-radius: 20px;" />

# ⚡ AttendIQ

### Smart College Attendance Tracker
*Track Today, Stay Ahead*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![CI](https://github.com/Aashutosh-Mahajan/AttendIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/Aashutosh-Mahajan/AttendIQ/actions/workflows/ci.yml)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Attendance Engine](#-attendance-engine)
- [Auth Flow](#-auth-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Deployment](#-deployment)
- [CI/CD](#-cicd)
- [Scripts](#-scripts)

---

## 🌟 Overview

**AttendIQ** is a full-stack web application for college students to track subject-wise attendance automatically. Define your weekly timetable once — AttendIQ generates every lecture instance across the semester, tracks your status, and tells you exactly how many classes you can skip or must attend to meet your target.

---

## ✨ Features

**Weekly Dashboard**
- Day-by-day 6-column view (Mon–Sat) with live lecture cards
- One-click status update: `Attended`, `Missed`, `Holiday`, `Scheduled`
- Bulk mark entire day as Holiday for college closures
- Week navigation with instant jump to Today

**Attendance Engine**
- Real-time percentage per subject and overall
- **Safe Skip Calculator** — exact number of classes you can miss without dropping below target
- **Recovery Calculator** — consecutive classes needed to recover from low attendance
- Status badges: `SAFE` (green) · `WARNING` (amber) · `CRITICAL` (red)

**Timetable Builder**
- Recurring weekly schedule builder
- Auto collision detection — prevents overlapping time slots
- Lectures auto-generated for the entire semester on slot creation
- Safe timetable edits — past attendance history is never overwritten

**Subjects & Analytics**
- Per-subject color tags and target percentage customization
- Recharts bar chart comparing subjects against target threshold
- Semester progression trend line chart

**Authentication**
- Email + Password signup with OTP email verification
- 6-digit OTP for password reset
- Settings page with OTP-verified password change
- Session managed via Supabase SSR cookies

**UI**
- Obsidian dark theme (`#0b0f17`) with frosted glass cards
- Glowing status indicators and gradient accents
- Fully responsive with mobile navigation drawer

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + Glassmorphism |
| ORM | Prisma 6 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Email OTP) |
| Charts | Recharts |
| Icons | Lucide React |
| Date Utils | date-fns |
| Deployment | Vercel |
| CI | GitHub Actions |

---

## 📁 Project Structure

```
AttendIQ/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions — type-check & lint on every push
├── prisma/
│   ├── schema.prisma           # Prisma schema (Semester, Subject, TimetableSlot, LectureInstance)
│   ├── migrations/             # SQL migration history
│   └── seed.ts                 # Seed script (clears business data)
├── public/
│   └── logo.jpg                # App logo
├── scripts/
│   └── rls-policies.sql        # Supabase Row Level Security policies
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...path]/  # Catch-all stub (legacy)
│   │   │   │   ├── callback/   # Supabase OAuth/magic-link callback
│   │   │   │   └── me/         # GET current user
│   │   │   ├── lectures/       # GET/PATCH/POST lecture instances
│   │   │   │   └── generate/   # POST trigger lecture generation
│   │   │   ├── semesters/      # GET/POST/PATCH semesters
│   │   │   ├── subjects/       # GET/POST/PUT/DELETE subjects
│   │   │   ├── timetable/      # GET/POST/PUT/DELETE timetable slots
│   │   │   └── settings/
│   │   │       ├── route.ts    # GET/PATCH profile settings
│   │   │       └── password/
│   │   │           ├── request/  # POST send password reset OTP
│   │   │           └── update/   # POST update password
│   │   ├── analytics/          # Analytics & charts page
│   │   ├── forgot-password/    # Forgot password page
│   │   ├── login/              # Login page
│   │   ├── reset-password/     # Reset password (OTP + new password)
│   │   ├── settings/           # User settings page
│   │   ├── signup/             # Signup page (2-step with OTP)
│   │   ├── subjects/           # Subjects & attendance page
│   │   ├── timetable/          # Timetable builder page
│   │   ├── verify-email/       # Email OTP verification page
│   │   ├── globals.css         # Obsidian dark theme & glassmorphism utilities
│   │   ├── layout.tsx          # Root layout with AppShell
│   │   └── page.tsx            # Weekly dashboard home
│   ├── components/
│   │   ├── analytics/          # AttendanceCharts (Recharts)
│   │   ├── auth/               # AuthForm (login/signup/OTP/reset)
│   │   ├── dashboard/          # WeeklyView, LectureCard, LiveClock
│   │   ├── layout/             # AppShell (sidebar + mobile nav)
│   │   ├── subject/            # BunkCalculatorCard
│   │   └── timetable/          # TimetableGrid
│   ├── emails/
│   │   ├── otp-template.html         # Supabase signup OTP email template
│   │   └── reset-password-template.html  # Supabase password reset email template
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── client.ts       # Supabase browser client
│   │   │   └── server.ts       # Supabase server client (SSR)
│   │   ├── calculator.ts       # Attendance & safe skip/recovery engine
│   │   ├── generator.ts        # Semester-wide lecture auto-generator
│   │   ├── getUser.ts          # Server-side auth helper
│   │   └── prisma.ts           # Singleton PrismaClient
│   └── middleware.ts           # Route protection (Supabase session check)
├── .env.example                # Environment variable template
├── vercel.json                 # Vercel deployment config
├── next.config.js              # Next.js config
├── prisma/schema.prisma        # Database schema
└── package.json
```

---

## 🧮 Attendance Engine

All calculations live in `src/lib/calculator.ts`. Only `ATTENDED` and `MISSED` statuses count — `HOLIDAY` and `SCHEDULED` are excluded.

**Attendance Percentage**
```
percentage = (attended / (attended + missed)) × 100
```

**Safe Skips** — when `percentage >= target`
```
skippable = floor((attended - targetRatio × counted) / targetRatio)
```

**Recovery Classes** — when `percentage < target`
```
mustAttend = ceil((targetRatio × counted - attended) / (1 - targetRatio))
```

Where `targetRatio = targetPercentage / 100` (default 75%).

---

## 🔐 Auth Flow

| Flow | Steps |
|---|---|
| **Sign up** | Enter name/email/password → OTP sent via Supabase → Enter 6-digit code → Logged in |
| **Login** | Email + password → Session cookie set → Dashboard |
| **Forgot password** | Enter email → Reset OTP email sent → Enter code + new password → Login |
| **Change password** (settings) | Click "Send verification code" → OTP email sent → Enter code → Enter new password |
| **Session** | Supabase SSR cookies, refreshed by middleware on every request |

Email templates are in `src/emails/` — add them to **Supabase → Authentication → Email Templates**.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A [Supabase](https://supabase.com) project

### Local Setup

**1. Clone the repo**
```bash
git clone https://github.com/Aashutosh-Mahajan/AttendIQ.git
cd AttendIQ
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```
Fill in your Supabase credentials (see [Environment Variables](#-environment-variables)).

**4. Push database schema**
```bash
npx prisma db push
```

**5. Apply RLS policies**

Open `scripts/rls-policies.sql` and run it in **Supabase → SQL Editor**.

**6. Start the dev server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
# Supabase PostgreSQL — Transaction mode (port 6543, for Prisma runtime)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase PostgreSQL — Direct connection (port 5432, for Prisma migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase project URL — Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"

# Supabase anon public key — Project Settings → API → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Your site URL (used in auth email redirect links)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Where to find values in Supabase Dashboard:
- `DATABASE_URL` / `DIRECT_URL` → Project Settings → Database → Connection string
- `NEXT_PUBLIC_SUPABASE_URL` → Project Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Project Settings → API → anon public key

---

## 🗄 Database Setup

The schema has four tables — all owned by your app, users are managed by Supabase Auth.

```
Semester ──< Subject ──< TimetableSlot
                    ──< LectureInstance
```

**Run migrations**
```bash
# Development — push schema directly
npx prisma db push

# Production — run migration history
npx prisma migrate deploy
```

**Apply RLS policies** (required for Supabase security)

Run `scripts/rls-policies.sql` in Supabase → SQL Editor. This ensures each user can only read/write their own data.

---

## 🌐 Deployment

### Vercel (recommended)

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Set **Build Command** to:
   ```
   prisma generate && next build
   ```
3. Add all 5 environment variables (same as `.env` but with your production Supabase URL for `NEXT_PUBLIC_SITE_URL`)
4. Deploy

**After first deploy — update Supabase Auth URLs:**

Go to Supabase → Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/api/auth/callback` and `https://your-app.vercel.app/reset-password`

Then update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your real deployment URL and redeploy.

---

## ⚙️ CI/CD

GitHub Actions runs on every push and pull request to `main`.

**Workflow** (`.github/workflows/ci.yml`):
1. Install dependencies (`npm ci`)
2. TypeScript type-check (`tsc --noEmit`)
3. Lint (`next lint`)

The build itself is handled by Vercel on deploy — CI only validates code correctness.

**Required GitHub Secrets** (Settings → Secrets → Actions):

| Secret | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Your deployed site URL |

---

## 📝 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type-check |
| `npx prisma db push` | Sync schema to database (dev) |
| `npx prisma migrate deploy` | Run migrations (production) |
| `npx prisma studio` | Open Prisma database browser |

---

---

<div align="center">
  <sub>Built by <a href="https://github.com/Aashutosh-Mahajan">Aashutosh Mahajan</a></sub>
</div>

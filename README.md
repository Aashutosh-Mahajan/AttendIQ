<div align="center">

# ⚡ AttendIQ

### **Smart College Attendance Tracker**

*Automated lecture scheduling, live attendance analytics, and intelligent safe skip & recovery recommendations.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

</div>

---

## 🌟 Overview

**AttendIQ** is a personal web application designed for college students to track subject-wise and overall attendance effortlessly. By defining your weekly timetable once, AttendIQ automatically generates your daily lecture schedule.

With the built-in **Attendance Engine**, the app calculates exactly how many classes you can safely miss while staying above your target percentage (e.g. 75%), or how many consecutive classes you must attend if you fall below threshold.

---

## ✨ Features

- 📅 **Weekly Interactive Dashboard**: 
  - Day-by-day 6-column view (Monday–Saturday) with lecture cards.
  - Status management: `Scheduled`, `Attended`, `Missed`, and `Holiday`.
  - Bulk **Mark Day as Holiday** for college closures.
  - Week-by-week navigation controls with instant "Today" jump.

- 🧮 **Safe Skips & Recovery Engine**:
  - Real-time attendance percentage calculation.
  - **Safe Skips Indicator**: Tells you exact number of classes you can miss without dropping below target %.
  - **Recovery Indicator**: Tells you exact number of consecutive classes required to recover lost attendance.

- ⚡ **Rolling-Window Lecture Generator**:
  - Automatically generates upcoming dated lecture instances 3 weeks in advance based on your active timetable.
  - **Safeguarded**: Editing timetables mid-semester never overwrites past historical attendance data.

- 🎨 **Ultra-Sleek Obsidian Dark Theme**:
  - Premium modern UI built on `#0b0f17` obsidian background with frosted glass cards (`backdrop-blur-md`).
  - Glowing status badges (Emerald for Attended, Cyan for Active, Rose for Missed, Amber for Holiday).
  - Fully responsive with mobile navigation drawer.

- 📊 **Analytics & Visual Insights**:
  - Recharts bar chart comparing subject attendance percentages against target threshold lines.
  - Semester progression trend line chart.

- 📅 **Timetable Builder & Overlap Validation**:
  - Drag/click weekly schedule builder with automatic collision detection preventing time slot overlaps.
  - Subject color tag customizers and target percentage sliders.

---

## 🧮 Mathematical Formulas

The attendance calculation engine operates on the following rules:

### 1. Attendance Percentage
$$\text{Percentage} = \frac{\text{Attended}}{\text{Attended} + \text{Missed}} \times 100$$
*(Note: `HOLIDAY` and future `SCHEDULED` lectures are excluded from calculations).*

### 2. Maximum Safe Skips ($S$)
When current percentage is **at or above** target ($P \ge P_{\text{target}}$):
$$S = \left\lfloor \frac{\text{Attended} - (\text{Target Ratio} \times \text{Counted})}{\text{Target Ratio}} \right\rfloor$$
*Where $\text{Target Ratio} = \frac{\text{Target \%}}{100}$.*

### 3. Minimum Required Attendance ($N$)
When current percentage is **below** target ($P < P_{\text{target}}$):
$$N = \left\lceil \frac{(\text{Target Ratio} \times \text{Counted}) - \text{Attended}}{1 - \text{Target Ratio}} \right\rceil$$

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server-side rendering, React Server Components & API routes |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | Tailwind CSS v4 & Glassmorphism | Custom dark theme system with backdrop blurs and glowing accents |
| **Database** | SQLite via Prisma ORM | Zero-config relational storage & migrations |
| **Icons & Charts** | Lucide React & Recharts | Modern icons and responsive data visualizations |
| **Date Utility** | `date-fns` | Date calculations, week boundaries, and formatting |

---

## 📁 Project Structure

```text
AttendIQ/
├── prisma/
│   ├── schema.prisma       # Prisma data schema (User, Semester, Subject, TimetableSlot, LectureInstance)
│   └── seed.ts             # Seed script populating demo user & semester
├── src/
│   ├── app/
│   │   ├── analytics/      # Analytics & Recharts page (/analytics)
│   │   ├── api/            # REST API endpoints (auth, semesters, subjects, timetable, lectures)
│   │   ├── settings/       # Settings & Semester Management (/settings)
│   │   ├── subjects/       # Subjects & Attendance (/subjects)
│   │   ├── timetable/      # Weekly Timetable Builder (/timetable)
│   │   ├── globals.css     # Dark obsidian theme & glassmorphism utilities
│   │   ├── layout.tsx      # Root layout wrapped in AppShell navigation
│   │   └── page.tsx        # Main Weekly Dashboard home page
│   ├── components/
│   │   ├── analytics/      # Recharts bar & line chart components
│   │   ├── dashboard/      # WeeklyView & LectureCard components
│   │   ├── layout/         # AppShell sidebar navigation & header
│   │   ├── subject/        # Subject attendance status components
│   │   └── timetable/      # TimetableGrid scheduler component
│   └── lib/
│       ├── calculator.ts   # Attendance & safe skip calculation engine
│       ├── generator.ts    # Rolling lecture auto-generation engine
│       └── prisma.ts       # Singleton PrismaClient instance
├── tailwind.config.js      # Custom obsidian color palette & glow utilities
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aashutosh-Mahajan/AttendIQ.git
   cd AttendIQ
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Database Schema & Seed Data**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run build` | Builds the production bundle and runs type checks |
| `npm start` | Starts the production server |
| `npx prisma db push` | Syncs the Prisma schema with the SQLite database |
| `npx tsx prisma/seed.ts` | Seeds the database |

---

## 🔒 License

This project is open source and available under the [MIT License](LICENSE).

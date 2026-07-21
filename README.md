
## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [PWA & Offline Support](#-pwa--offline-support)
- [Multi-Organization Support](#-multi-organization-support)
- [Deployment](#-deployment)

---

## 🌟 Overview

EquipTracker solves a real problem for small and medium businesses: warranty cards get lost, maintenance is forgotten, and when equipment breaks, nobody knows what's covered or who to call.

This app acts as a **single source of truth** for all business equipment — from purchase date to warranty expiry to maintenance history — and uses **AI to automate the painful parts** like extracting data from receipts and drafting warranty claim letters.

---

## ✨ Key Features

### 🤖 AI-Powered Equipment Onboarding
Upload a photo of a **nameplate, receipt, or invoice PDF** and Google Gemini 2.5 Flash automatically extracts:
- Equipment name, model, and serial number
- Purchase date and price
- Retailer and purchase platform (Amazon, Flipkart, etc.)
- Warranty duration

### 📅 Warranty Tracking
- Automatic warranty expiry calculation from purchase date + warranty months
- Visual health scores per equipment item
- Business-level **Protected Value** vs **Unprotected Value** dashboard
- Color-coded status indicators (active, expiring soon, expired)

### 🔧 Maintenance Scheduling
- Category-based maintenance templates (e.g., "Clean filters every 30 days")
- Automatic next-due-date calculation on task completion
- Maintenance log history with timestamps and staff records
- Weekly maintenance digest on the dashboard

### 📨 AI Warranty Claim Generator
- Describe the issue in plain language
- Gemini AI drafts a **professional warranty claim letter** tailored to the equipment and business
- One-click email submission to a care center via **Resend**

### 📱 Progressive Web App (PWA)
- Installable on mobile and desktop
- Offline-capable with service worker caching (Workbox)
- Equipment card pages cached for 30 days for offline access
- Custom offline fallback page

### 🏢 Multi-Organization Support
- A single user can belong to multiple organizations
- Role-based access: `owner` and `staff`
- Quick business switching with persistent `last_active_business_id`
- Owners can manage team memberships

### ⌨️ Command Palette
- `Cmd/Ctrl + K` to open a fuzzy-search command palette (powered by cmdk + Fuse.js)
- Navigate to any equipment or page instantly

### 🖨️ Print & QR Code
- Print equipment detail cards
- QR codes for quick equipment identification

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security) |
| **AI / Vision** | [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (`@google/generative-ai`) |
| **Email** | [Resend](https://resend.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **PWA** | [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) (Workbox) |
| **Search** | [Fuse.js](https://fusejs.io/) (fuzzy search) |
| **Command Palette** | [cmdk](https://cmdk.paco.me/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/) |
| **QR Codes** | [qrcode](https://www.npmjs.com/package/qrcode) |

---

## 📁 Project Structure

```
warrantyFinder/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, toaster, PWA install prompt)
│   ├── page.tsx                  # Root redirect → /dashboard
│   ├── globals.css               # Global styles & CSS variables
│   ├── manifest.ts               # PWA web app manifest
│   ├── api/
│   │   └── cron/                 # Scheduled jobs (e.g., warranty expiry notifications)
│   ├── auth/                     # Supabase auth callback handlers
│   ├── login/                    # Login / Sign-up page
│   ├── onboarding/               # New user business creation flow
│   ├── offline/                  # PWA offline fallback page
│   └── dashboard/
│       ├── page.tsx              # Redirect to last active business
│       └── [businessId]/
│           ├── layout.tsx        # Sidebar + nav shell
│           ├── page.tsx          # Dashboard overview (health score, maintenance due)
│           ├── equipment/        # Equipment list, new form, detail/card/timeline views
│           └── claims/           # Warranty claims list and AI claim detail view
│
├── components/
│   ├── CommandPalette.tsx        # Global Cmd+K search palette
│   ├── InstallPrompt.tsx         # PWA install banner
│   ├── dashboard/
│   │   └── MaintenanceTaskListClient.tsx  # Interactive maintenance task list
│   ├── equipment/
│   │   ├── EquipmentListClient.tsx        # Full equipment list with filters & search
│   │   ├── EquipmentTimelineClient.tsx    # Visual warranty timeline
│   │   └── PrintButton.tsx               # Client-side print trigger
│   ├── layout/                   # Sidebar, nav, business switcher
│   └── ui/                       # Shared UI primitives (buttons, badges, modals)
│
├── lib/
│   ├── actions/
│   │   ├── equipment.ts          # Server actions: create, AI extract, mark maintenance done
│   │   ├── claims.ts             # Server actions: start claim, AI generate, submit via Resend
│   │   └── orgs.ts               # Server actions: create organization, manage memberships
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client (SSR cookies)
│
├── supabase/
│   ├── seed.sql                  # Maintenance template seed data
│   └── migrations/
│       ├── 0001_init.sql         # Core schema: businesses, profiles, equipment, claims
│       ├── 0002_warranty_details_and_health.sql  # Health score view, warranty fields
│       ├── 0003_purchase_platform_and_warranty_source.sql
│       ├── 0004_platforms.sql    # Platforms table (Amazon, Flipkart, etc.)
│       └── 0005_multi_org.sql    # Multi-org: memberships table, updated RLS policies
│
├── public/                       # Static assets, PWA icons, service worker
├── .env.local.example            # Environment variable template
├── next.config.ts                # Next.js + PWA configuration
└── tsconfig.json
```

---

## 🗄️ Database Schema

```
businesses            → Core organization/business entity
profiles              → User profile linked to auth.users; tracks last_active_business_id
memberships           → Many-to-many: users ↔ businesses, with role (owner | staff)
equipment             → Equipment records with warranty, purchase, and platform info
platforms             → Purchase platforms (Amazon, Flipkart, etc.)
maintenance_templates → Category-based default maintenance task definitions
maintenance_schedules → Per-equipment scheduled tasks with next_due_date
maintenance_logs      → Completion records per schedule with timestamp & staff
claims                → Warranty claim drafts and submissions
```

**Row Level Security (RLS)** is enforced on every table — users can only read/write data belonging to their own businesses via the `memberships` join.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- A [Resend](https://resend.com/) API key

### 1. Clone the repository

```bash
git clone https://github.com/susheepks/WarrantyTracker.git
cd WarrantyTracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local` (see [Environment Variables](#-environment-variables) below).

### 4. Set up the database

Run the migrations **in order** in your **Supabase SQL Editor**:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_warranty_details_and_health.sql
supabase/migrations/0003_purchase_platform_and_warranty_source.sql
supabase/migrations/0004_platforms.sql
supabase/migrations/0005_multi_org.sql
```

Then seed the maintenance templates:

```
supabase/seed.sql
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file based on `.env.local.example`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never exposed to client) |
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini 2.5 Flash |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `CARECENTER_EMAIL` | Email address where warranty claims are submitted |

> ⚠️ **Never commit `.env.local` to version control.** It is already listed in `.gitignore`.

---

## 📱 PWA & Offline Support

EquipTracker is a fully installable Progressive Web App.

- **Install prompt**: An in-app banner guides users to install the app on their home screen.
- **Service Worker**: Managed by Workbox via `@ducanh2912/next-pwa`.
- **Caching strategy**:

| Route Pattern | Strategy | Expiry |
|---|---|---|
| `/dashboard/equipment/[id]/card` | CacheFirst | 30 days |
| `/dashboard/**` | NetworkFirst | 1 day |
| `/api/**` | NetworkOnly | — |

- **Offline fallback**: A custom `/offline` page is shown when the network is unavailable.

> The PWA service worker is disabled in development and only activates in production builds.

---

## 🏢 Multi-Organization Support

A single user account can manage multiple businesses:

1. During **onboarding**, a user creates their first organization.
2. The `memberships` table tracks which users belong to which business, along with their `role` (`owner` or `staff`).
3. The user's `last_active_business_id` in `profiles` enables seamless business switching — the app remembers where you left off.
4. **Owners** can invite staff and manage memberships. **Staff** can view and update equipment but cannot delete records or manage the organization.
5. All database queries are scoped through the `memberships` table using Supabase RLS policies.

---

## 🚢 Deployment

The recommended deployment target is **Vercel**:

1. Push your repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env.local` in the Vercel project settings.
4. Deploy — Vercel handles the Next.js build and serverless functions automatically.


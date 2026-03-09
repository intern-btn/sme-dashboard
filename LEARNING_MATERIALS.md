# SME Dashboard - Interview Learning Materials

> Comprehensive technical reference for interview preparation.
> Project: BTN SME Credit Portfolio Monitoring Dashboard
> Stack: Next.js 14 · React 18 · Tailwind CSS · Vercel Blob

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Deep Dive](#2-tech-stack-deep-dive)
3. [Architecture & Design Patterns](#3-architecture--design-patterns)
4. [Feature Breakdown](#4-feature-breakdown)
5. [Component Architecture](#5-component-architecture)
6. [Key Data Structures](#6-key-data-structures)
7. [API Design](#7-api-design)
8. [Authentication System](#8-authentication-system)
9. [Interview Talking Points](#9-interview-talking-points)
10. [Glossary](#10-glossary)

---

## 1. Project Overview

### What Is This Project?

The SME Dashboard is a **real-time credit portfolio monitoring web application** built for **Bank BTN (Bank Tabungan Negara)** during an internship. It enables regional managers and executives to monitor the health of SME (Small-Medium Enterprise) credit portfolios across all of BTN's regional offices (Kanwil) in Indonesia.

### Business Problem It Solves

Before this dashboard, monitoring data required manually opening multiple Excel files and cross-referencing reports across 9 regional offices. This dashboard:
- Consolidates data from 5 different report types into a single interface
- Provides instant visual comparison of current vs. previous month performance
- Supports both boardroom TV presentations and individual browser use
- Allows non-technical admins to upload fresh data via a simple web form

### Scope

| Dimension | Detail |
|-----------|--------|
| **Regions (Kanwil)** | 9 — Jakarta I, Jakarta II, Jateng DIY, Jabanus, Jawa Barat, Kalimantan, Sulampua, Sumatera 1, Sumatera 2 |
| **Data Types** | 5 — NPL, KOL 2, Realisasi Kredit, Posisi Kredit, Realisasi Harian |
| **Display Modes** | 2 — TV Mode (auto-slide presentation), Browser Mode (interactive) |
| **Total Pages** | 11 — 1 daily page + 1 overview + 9 Kanwil detail pages |
| **Users** | Admin (data upload) + Viewers (dashboard access, no login required) |

### Key Metrics Tracked

- **NPL (Non-Performing Loans)** — Percentage of loans not being repaid on time
- **KOL 2 (Kolektibilitas 2)** — Loans classified as "Special Mention" (early warning)
- **Realisasi Kredit** — How much credit has actually been disbursed vs. target
- **Posisi Kredit** — Current total loan portfolio balance, compared to Jan 1 baseline
- **Realisasi Harian** — Daily disbursement tracking with month-over-month comparison

---

## 2. Tech Stack Deep Dive

### Core Framework: Next.js 14

**What it is:** React framework with built-in routing, server-side rendering, and API routes.

**Why it was chosen:**
- Combines frontend (React) and backend (API routes) in a single project — no separate Express server needed
- **App Router** provides file-based routing that maps naturally to the page structure (Overview, Kanwil 1-9)
- **Edge Runtime** support for authentication routes — runs closer to the user for lower latency
- **Standalone output mode** (`output: 'standalone'`) creates a self-contained build suitable for containerized deployment

**Key Next.js concepts used:**

| Concept | Usage in Project |
|---------|-----------------|
| App Router | `src/app/` directory structure with `page.js`, `layout.js` |
| API Routes | `src/app/api/` — auth, data, upload endpoints |
| Dynamic Routes | `/api/data/[type]/[file]` — serves any data type dynamically |
| Edge Runtime | Auth routes declared with `export const runtime = 'edge'` |
| Server Components | API route handlers run server-side only |
| Client Components | `'use client'` directive on interactive components |

**Config (`next.config.js`):**
```javascript
{
  output: 'standalone',  // Self-contained build for Docker/VM deployment
  reactStrictMode: true, // Catches common React mistakes in development
  swcMinify: true        // Faster JS minification using Rust-based SWC compiler
}
```

---

### UI Library: React 18

**What it is:** JavaScript library for building user interfaces with a component model.

**Key React 18 features used:**

| Feature | Usage |
|---------|-------|
| `useState` | Loading states, current page, tab selection, mode (TV/Browser) |
| `useEffect` | Data fetching on mount, localStorage read, event listener registration |
| `useCallback` | Memoizing navigation handlers to avoid re-renders in keyboard hook |
| `useRef` | Auto-slide timer references (prevents stale closure issues) |
| Custom Hooks | `useDataFetch`, `useKeyboardNav`, `useAutoSlide` — encapsulate complex logic |

**Why custom hooks?** Instead of putting all logic in one giant component, behavior is split into focused hooks:
- Easier to test in isolation
- Reusable across components
- Component code stays clean and declarative

---

### Styling: Tailwind CSS 3.4

**What it is:** Utility-first CSS framework — style elements with class names instead of writing CSS files.

**Why it was chosen:**
- Rapid prototyping — no context-switching between JSX and CSS files
- Responsive design with breakpoint prefixes (`sm:`, `lg:`) built-in
- No unused CSS in production (purged automatically)

**Custom brand colors (tailwind.config.js):**
```javascript
colors: {
  'btn-blue': '#003d7a',   // BTN primary blue — used for headers, sidebar, buttons
  'btn-orange': '#e84e0f', // BTN accent orange — used for highlights and alerts
}
```

**Responsive patterns used:**
```jsx
// Mobile: hidden sidebar | Desktop: fixed sidebar
<div className="hidden lg:flex lg:w-64 lg:flex-col">  {/* Sidebar */}
<button className="lg:hidden">                         {/* Hamburger menu */}
```

---

### Data Visualization: Recharts 2.15

**What it is:** React charting library built on top of D3.js, but with a React-friendly API.

**Usage:** `Realisasi.jsx` renders 5 line charts (Total, KUR, KUMK, KPP Supply, KPP Demand) comparing current month vs. previous month daily data.

**Why Recharts over alternatives:**
- Native React components (not imperative D3 API)
- Responsive containers with `ResponsiveContainer`
- Built-in tooltips and legends
- Lighter than Chart.js for this use case

**Pattern used:**
```jsx
<ResponsiveContainer width="100%" height={200}>
  <LineChart data={dailyData}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip formatter={(value) => formatCurrency(value)} />
    <Line dataKey="total" stroke="#003d7a" name="Bulan Ini" />
    <Line dataKey="total_previous" stroke="#94a3b8" name="Bulan Lalu" strokeDasharray="5 5" />
  </LineChart>
</ResponsiveContainer>
```

---

### PDF Export: jsPDF 4 + jspdf-autotable 5

**What it is:** Client-side PDF generation — runs entirely in the browser, no server needed.

**Why client-side PDF:**
- No server load for report generation
- User gets instant download
- Can access current rendered state

**How it works:**
```javascript
// src/app/lib/pdfExport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportTableToPDF({ title, columns, rows, filename }) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Branded header
  doc.setFillColor(0, 61, 122); // BTN Blue
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 13);

  // Auto table with color-coded cells
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 25,
    didParseCell: (data) => {
      // Red for negative gaps, green for positive
      if (data.cell.raw < 0) data.cell.styles.textColor = [220, 38, 38];
      if (data.cell.raw > 0) data.cell.styles.textColor = [34, 197, 94];
    }
  });

  doc.save(filename);
}
```

---

### Excel Parsing: XLSX (SheetJS) 0.18

**What it is:** Library to read/write Excel files (.xlsx, .xls) in JavaScript — runs on Node.js server side.

**Why server-side parsing:**
- Excel files can be large; server handles the heavy computation
- Parsed JSON is cached in Blob storage — clients never touch raw Excel
- Consistent parsing logic regardless of client device

**Pattern:**
```javascript
// src/lib/excel-parsers.js
import * as XLSX from 'xlsx';

export function parseNPLExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  // ... transform rows into structured data
}
```

**Multi-sheet parsing challenge:** The consolidated Excel upload needs to identify which sheet corresponds to which data type. This uses regex pattern matching on sheet names:
```javascript
// Sheet name patterns: '49c' → NPL, '49b' → KOL2, '22a' → Realisasi, etc.
const sheetMap = {
  npl: /49c/i,
  kol2: /49b/i,
  realisasi: /22a/i,
  realisasi_kredit: /44a1/i,
  posisi_kredit: /44b/i,
};
```

---

### Cloud Storage: @vercel/blob 0.23

**What it is:** Vercel's managed file storage service — stores and serves files from a CDN.

**Why Blob storage instead of a database:**
- Data comes as Excel files, not relational rows — JSON blobs fit naturally
- No database setup/maintenance required
- Files served from CDN — fast global access
- Simple API: `put()`, `get()`, `del()`

**Storage pattern:**
```
npl_parsed.json      ← Parsed NPL data (kanwilData, cabangData, totalNasional)
npl_metadata.json    ← Upload timestamp, record counts
kol2_parsed.json
kol2_metadata.json
... (5 data types × 2 files = 10 JSON files total)
```

**Trade-off to know:** This approach means no query capability — the entire dataset is loaded at once. Acceptable here because datasets are small (< 500 rows per type), but wouldn't scale to millions of records.

---

## 3. Architecture & Design Patterns

### Overall Architecture

```
                    ADMIN FLOW
┌─────────┐    POST /api/upload    ┌──────────────┐
│  Admin  │ ──────────────────────>│  API Route   │
│ Browser │                        │ (Node.js)    │
└─────────┘                        │              │
                                   │ 1. Parse     │
                                   │    Excel     │
                                   │    (XLSX)    │
                                   │ 2. Store     │──> Vercel Blob Storage
                                   │    JSON      │    (npl_parsed.json, etc.)
                                   └──────────────┘

                    VIEWER FLOW
┌─────────┐   GET /api/data/npl/   ┌──────────────┐    ┌──────────────┐
│ Viewer  │   parsed               │  API Route   │    │ Vercel Blob  │
│ Browser │ ──────────────────────>│ (Edge        │───>│   Storage    │
└─────────┘                        │  Runtime)    │    └──────────────┘
     ^                             └──────────────┘
     |                                    |
     | Renders component                  | Returns JSON
     |                                    v
     └──────────────────────── useDataFetch hook
```

### File Structure

```
sme-dashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.js               # Root page — layout, mode control, page routing
│   │   ├── layout.js             # HTML shell, font loading
│   │   ├── globals.css           # Global styles (Tailwind imports)
│   │   ├── admin/
│   │   │   └── page.js           # Admin upload portal
│   │   ├── api/
│   │   │   ├── auth/             # Login, logout, session check
│   │   │   ├── data/[type]/[file]/ # Data serving endpoint
│   │   │   ├── upload/           # File upload + processing
│   │   │   ├── status/           # Upload status endpoint
│   │   │   └── history/          # Upload history endpoint
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # Overview page (page 0)
│   │   │   ├── KanwilDetail.jsx  # Regional detail (pages 1-9)
│   │   │   ├── Realisasi.jsx     # Daily tracking (page -1)
│   │   │   ├── KOL2Dashboard.jsx
│   │   │   ├── KOL2KanwilDetail.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ExportButton.jsx
│   │   │   ├── ProgressIndicator.jsx
│   │   │   ├── AutoSlideIndicator.jsx
│   │   │   └── ModeToggle.jsx
│   │   ├── hooks/
│   │   │   ├── useDataFetch.js   # Data fetching with retry logic
│   │   │   ├── useKeyboardNav.js # Arrow key navigation
│   │   │   └── useAutoSlide.js   # TV mode auto-advance
│   │   └── lib/
│   │       ├── pdfExport.js      # PDF generation utilities
│   │       └── dateUtils.js      # Indonesian date formatting
│   └── lib/                      # Server-only utilities
│       ├── auth.js               # HMAC session management
│       └── excel-parsers.js      # Excel → JSON transformers
├── ConsolidateExcelFiles.bas     # VBA macro for Windows users
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.local                    # Environment variables (not in git)
```

### Custom Hooks Pattern

Custom hooks are the primary state management strategy — no Redux, no Zustand:

**`useDataFetch(dataType)`**
```javascript
// Encapsulates: fetch → loading → error → retry logic
const { data, metadata, loading, error, noData, refresh } = useDataFetch('npl');
```
- Fetches metadata first (quick), then parsed data (larger)
- Retries up to 3 times on 504 timeout
- Distinguishes `noData` (404 = not uploaded yet) from `error` (500 = something broke)

**`useKeyboardNav()`**
```javascript
// Encapsulates: event listeners, page state, wrapping logic
const { currentPage, goTo } = useKeyboardNav();
// ArrowRight: currentPage + 1, wraps 9 → -1
// ArrowLeft: currentPage - 1, wraps -1 → 9
```

**`useAutoSlide(currentPage, goTo, isEnabled)`**
```javascript
// Encapsulates: 30-second interval, pause/resume, countdown display
const { isPaused, countdown, togglePause } = useAutoSlide(currentPage, goTo, tvMode);
```

### Separation of Concerns

| Layer | Responsibility |
|-------|---------------|
| `page.js` | Layout, mode switching, page routing |
| Component (`Dashboard.jsx`, etc.) | Rendering, user interaction |
| Custom Hook | State management, side effects |
| API Route | Data serving, auth checking |
| `lib/auth.js` | Token creation/verification |
| `lib/excel-parsers.js` | Data transformation |

---

## 4. Feature Breakdown

### TV Mode vs Browser Mode

Two fundamentally different UX paradigms served by the same codebase:

| Aspect | TV Mode | Browser Mode |
|--------|---------|-------------|
| **Purpose** | Boardroom presentation on large screen | Individual analyst use |
| **Navigation** | Auto-advances every 30s + arrow keys | Sidebar click navigation |
| **Layout** | Full-screen, no sidebar | Fixed sidebar (256px wide) |
| **Controls** | On-screen indicators only | Full sidebar menu |
| **Persistence** | `localStorage.setItem('dashboardMode', 'tv')` | `localStorage.setItem('dashboardMode', 'browser')` |

**Auto-slide implementation:**
```javascript
// useAutoSlide.js — key insight: use useRef for timer to avoid stale closures
const timerRef = useRef(null);

useEffect(() => {
  if (!isEnabled || isPaused) return;

  timerRef.current = setInterval(() => {
    goTo(nextPage);  // Next page with wrapping
  }, 30000);

  return () => clearInterval(timerRef.current);  // Cleanup on unmount/pause
}, [isEnabled, isPaused, currentPage]);
```

**Why `useRef` for the timer?** If you used `useState` for the interval ID, updating it would trigger a re-render, which would restart the effect, causing an infinite loop. `useRef` stores the value without triggering re-renders.

---

### Data Types Explained

#### NPL (Non-Performing Loans)
- **Banking definition:** Loans where the borrower has not made scheduled payments for 90+ days
- **Tracked as:** Percentage (NPL ratio = NPL balance / total loan balance)
- **Sub-segments:** KUMK (conventional SME loans) and KUR (government-subsidized SME loans)
- **Good vs bad:** Lower NPL % = better. Red flags when NPL rises MoM.

#### KOL 2 (Kolektibilitas 2 / Special Mention)
- **Banking definition:** Loans 30-90 days overdue — "early warning" category before becoming NPL
- **Why it matters:** Leading indicator — high KOL 2 today means high NPL next quarter
- **Structure:** Same KUMK/KUR breakdown as NPL

#### Realisasi Kredit (Credit Realization)
- **Definition:** How much credit has been disbursed to SME borrowers in the current month
- **Tracked as:** Absolute amount in Rp billions
- **Sub-segments:** KUMK (up to 26th of month), KUR, combined total
- **Performance signal:** Compare to internal target or previous month same period

#### Posisi Kredit (Credit Position)
- **Definition:** Total outstanding loan balance at any given point
- **Tracked from:** January 1 baseline
- **Key metrics:**
  - `posisi_jan` — Balance on Jan 1 (the starting point)
  - `posisi_current` — Today's balance
  - `gap_mtd` — Change since Jan 1 (Month-to-Date)
  - `gap_yoy` — Change vs. same day last year (Year-over-Year)

#### Realisasi Harian (Daily Realization)
- **Definition:** Day-by-day disbursement tracking for the current month
- **Comparison:** Current month vs. same day in the previous month
- **Visualized as:** Line charts with 5 components (KUR, KUMK PRK, SME Swadana, KUMK Lainnya, KPP Supply, KPP Demand)

---

### Excel Upload Pipeline

**Two upload modes for different use cases:**

**Mode 1: Separate Files** (simpler, for small updates)
```
Admin selects up to 5 files:
├── NPL file       → POST /api/upload { type: 'npl', file: ... }
├── KOL2 file      → POST /api/upload { type: 'kol2', file: ... }
├── Realisasi file → POST /api/upload { type: 'realisasi', file: ... }
└── ...
Each file parsed individually, stored as JSON in Blob
```

**Mode 2: Multi-Sheet Excel** (for consolidated file from VBA macro)
```
Admin selects 1 consolidated Excel file:
  → POST /api/upload/token        (get signed URL for direct upload)
  → Client uploads file to Blob   (up to 15MB directly, bypasses 4.5MB API limit)
  → POST /api/upload/process      (tells server to parse all sheets)
      Server: downloads from Blob
      Server: identifies sheets by regex (49c → NPL, 49b → KOL2, ...)
      Server: parses each sheet, stores 5 JSON files
      Server: returns stats + missing sheet warnings
```

**Why two-step for large files?**
Vercel serverless functions have a 4.5MB request body limit. By getting a signed URL and uploading directly to Blob storage, the file bypasses the serverless function entirely. The function only processes (reads from Blob), not ingests.

---

## 5. Component Architecture

### Rendering Tree

```
page.js  (root — manages mode, page, layout)
│
├── [TV Mode Layout]                [Browser Mode Layout]
│   Full-screen, no sidebar         Fixed sidebar + content area
│
├── ProgressIndicator               Sidebar
│   (current page dots)             ├── Realisasi Harian
│                                   ├── Overview Dashboard
├── AutoSlideIndicator              ├── Kanwil Jakarta I
│   (countdown timer)               ├── ... (9 Kanwil)
│                                   └── ModeToggle
└── ModeToggle
│
├── Realisasi (currentPage === -1)
│   ├── useDataFetch('realisasi')
│   ├── Summary cards (MTD totals, MoM growth %)
│   ├── 5x LineChart (Recharts)
│   └── Daily breakdown table
│
├── Dashboard (currentPage === 0)
│   ├── useDataFetch('npl')
│   ├── useDataFetch('kol2')
│   ├── useDataFetch('realisasi_kredit')
│   ├── useDataFetch('posisi_kredit')
│   ├── Tab selector (NPL / KOL 2 / Realisasi Kredit / Posisi Kredit)
│   ├── National summary cards
│   └── Kanwil-level table
│
└── KanwilDetail (currentPage 1-9)
    ├── useDataFetch('npl')         (same hooks, filters by kanwil)
    ├── useDataFetch('kol2')
    ├── useDataFetch('realisasi_kredit')
    ├── useDataFetch('posisi_kredit')
    ├── Tab selector
    ├── Kanwil summary card (current vs. previous month)
    └── Cabang-level table (sorted by total desc)
```

### ExportButton Component

Reusable export button with three states:
```jsx
// ExportButton.jsx
function ExportButton({ onExport, filename }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onExport();  // Caller provides the specific format function
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Generating...' : 'Export PDF'}
      {error && <Tooltip>{error}</Tooltip>}
    </button>
  );
}
```

The parent passes in the specific formatter:
```jsx
<ExportButton
  onExport={() => exportTableToPDF(formatNPLKanwilData(data, monthInfo))}
  filename={`NPL_${kanwilName}.pdf`}
/>
```

---

## 6. Key Data Structures

### NPL / KOL2 Data Shape

```javascript
{
  // National aggregate totals
  totalNasional: {
    total_current: 1234567,        // Current month total (Rp millions)
    total_previous: 1200000,       // Previous month total
    kumk_current: 800000,          // KUMK segment current
    kumk_previous: 780000,
    kur_current: 434567,           // KUR segment current
    kur_previous: 420000,
    totalPercent_current: 2.45,    // NPL percentage total
    totalPercent_previous: 2.38,
    kumkPercent_current: 3.12,
    kumkPercent_previous: 3.05,
    kurPercent_current: 1.87,
    kurPercent_previous: 1.78,
  },

  // One entry per Kanwil (9 rows)
  kanwilData: [
    {
      name: 'Jakarta I',
      kumk_current: 120000,
      kur_current: 65000,
      total_current: 185000,
      kumkPercent_current: 3.5,
      kurPercent_current: 2.1,
      totalPercent_current: 2.9,
      // ... previous month equivalents
    }
  ],

  // One entry per branch (Cabang), tagged with parent Kanwil
  cabangData: [
    {
      name: 'Cabang Rawamangun',
      kanwil: 'Jakarta I',          // Links to parent Kanwil
      kumk_current: 15000,
      kur_current: 8000,
      total_current: 23000,
      gap_total: -500,              // Negative = worse than last month
      gap_kumk: -300,
      gap_kur: -200,
      // ... percentages
    }
  ],

  // Month metadata for display labels
  monthInfo: {
    current: {
      label: 'Februari 2025',
      shortLabel: 'Feb 2025',
      month: 2,
      year: 2025
    },
    previous: {
      label: 'Januari 2025',
      shortLabel: 'Jan 2025',
      month: 1,
      year: 2025
    }
  }
}
```

### Realisasi Harian Data Shape

```javascript
{
  dailyData: [
    {
      date: '2025-02-01',
      kur: 25000,                  // KUR disbursed on this day (Rp millions)
      kumk: 18000,                 // KUMK disbursed this day
      smeSwadana: 5000,
      kumkLainnya: 3000,
      kppSupply: 8000,
      kppDemand: 2000,
      total: 61000,                // Sum of all components
      // Previous month same-day values for comparison
      kur_previous: 22000,
      kumk_previous: 17000,
      total_previous: 55000,
      // ... other _previous fields
    }
    // ... one entry per day of the month so far
  ],
  monthlyTotals: {
    current: 850000,               // MTD total this month
    previous: 780000,              // MTD total last month (same day)
    growth: 8.97                   // Percentage growth
  },
  monthInfo: { /* same structure as above */ }
}
```

### Posisi Kredit Data Shape

```javascript
{
  totalNasional: {
    posisi_jan: 45000000,          // Balance on Jan 1 (baseline)
    realisasi: 8500000,            // Total disbursed YTD
    runoff: 7200000,               // Loans repaid/matured YTD
    posisi_current: 46300000,      // Current balance (jan + realisasi - runoff)
    gap_mtd: 1300000,              // Change since Jan 1 (positive = portfolio grew)
    gap_yoy: 3200000               // Change vs. same day last year
  },
  kanwilData: [ /* same fields per Kanwil */ ],
  cabangData: [ /* same fields per Cabang */ ],
  monthInfo: { /* ... */ }
}
```

---

## 7. API Design

### Endpoint Reference

```
Authentication
─────────────
POST   /api/auth              Login — returns signed session cookie
GET    /api/auth/check        Verify session is still valid
POST   /api/auth/logout       Clear session cookie

Data Serving
────────────
GET    /api/data/:type/parsed    Fetch parsed JSON data
GET    /api/data/:type/metadata  Fetch upload metadata (timestamp, record counts)

:type can be: npl | kol2 | realisasi | realisasi_kredit | posisi_kredit

Upload
──────
POST   /api/upload               Upload individual Excel file (max ~4.5MB)
                                 Body: FormData { type, file }
POST   /api/upload/token         Get signed URL for direct-to-Blob upload
POST   /api/upload/process       Process multi-sheet Excel already in Blob

Monitoring
──────────
GET    /api/status               Current status of all 5 data types
GET    /api/history              Upload history with timestamps
```

### Data API Pattern (`/api/data/[type]/[file]`)

```javascript
// src/app/api/data/[type]/[file]/route.js
export const runtime = 'edge';  // Run at the edge network, not central server

export async function GET(request, { params }) {
  const { type, file } = params;                  // e.g., type='npl', file='parsed'
  const blobUrl = `${process.env.BLOB_BASE_URL}/${type}_${file}.json`;

  const response = await fetch(blobUrl, { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    return Response.json({ error: 'Not found' }, { status: response.status });
  }

  const data = await response.json();
  return Response.json(data);
}
```

**Key design decisions:**
- Edge Runtime → lower latency, runs closer to the user geographically
- Dynamic `[type]/[file]` route → one route handles all 10 combinations (5 types × 2 files)
- 15-second timeout → prevents hanging requests from slow Blob reads

---

## 8. Authentication System

### How It Works

The admin area (`/admin`) uses a custom session-based auth system with HMAC-SHA256 signed tokens.

**Why not JWT?** This is a custom implementation of a similar concept — a signed token with an expiry timestamp. The approach is effectively the same as JWT's HS256 algorithm but implemented manually.

**Flow:**
```
1. Admin enters password on /admin page
2. POST /api/auth { password: "..." }
3. Server validates against ADMIN_PASSWORD env var
4. Server creates token:
   payload = base64(JSON({ userId: 'admin', exp: now + 24h }))
   signature = HMAC-SHA256(payload, SESSION_SECRET)
   token = payload + '.' + signature
5. Server sets cookie: admin_session=token; HttpOnly; Secure; SameSite=Strict
6. Subsequent requests: server extracts cookie, verifies HMAC, checks expiry
```

**Security features:**
| Feature | Purpose |
|---------|---------|
| `HttpOnly` cookie | JavaScript on the page cannot read the cookie → prevents XSS theft |
| `Secure` flag | Cookie only sent over HTTPS in production |
| `SameSite=Strict` | Prevents CSRF attacks |
| HMAC-SHA256 | Token cannot be forged without knowing the SECRET |
| Expiry timestamp | Tokens auto-expire after 24 hours |
| Rate limiting | Max 5 failed attempts → 15-minute IP lockout |

**Rate limiting implementation:**
```javascript
// In-memory map of IP → { attempts, lastAttempt }
// Resets on cold start (serverless function restart)
const attempts = new Map();

function checkRateLimit(ip) {
  const record = attempts.get(ip) || { count: 0, firstAttempt: Date.now() };
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (Date.now() - record.firstAttempt > windowMs) {
    attempts.delete(ip); // Reset window
    return { allowed: true };
  }

  if (record.count >= 5) {
    return { allowed: false, retryAfter: windowMs };
  }

  return { allowed: true };
}
```

**Limitation to mention:** Because rate limit state is in-memory, it resets on serverless cold starts. For production hardening, this would move to a Redis store.

---

## 9. Interview Talking Points

### "Tell me about this project"

> "I built a real-time credit portfolio monitoring dashboard for Bank BTN during my internship. It monitors SME loan metrics across 9 regional offices in Indonesia — things like non-performing loan ratios and daily credit disbursements. The key technical challenge was creating a system where non-technical staff could upload Excel reports through a web form, and the data would be automatically parsed, stored, and immediately visible on the dashboard. I used Next.js 14 with its App Router, which let me build both the frontend React UI and the backend API routes in a single project."

---

### "What was the most challenging part?"

Three good answers depending on what interviewers value:

**Technical complexity:**
> "The Excel parsing was tricky. Each regional office's report had slightly different formatting, and the consolidated multi-sheet Excel needed regex-based sheet name detection to map sheets to data types. I also hit Vercel's 4.5MB serverless body limit, so I implemented a two-step upload: first getting a signed URL to upload directly to Blob storage, then triggering a separate API call to process the file."

**UX/Product:**
> "Designing for two completely different user contexts — a TV in a boardroom auto-advancing every 30 seconds, and an analyst on a laptop clicking through tabs. I had to build layout systems that worked for both without code duplication, which led me to a mode-switching architecture with localStorage persistence."

**Architecture:**
> "Deciding on state management. I wanted to avoid Redux overhead for a project of this scale, so I built custom hooks to encapsulate the different concerns — data fetching with retry logic, keyboard navigation, and the auto-slide timer. The auto-slide timer specifically required using `useRef` rather than `useState` to avoid stale closure bugs with `setInterval`."

---

### "Why did you choose these technologies?"

| Question | Answer |
|----------|--------|
| Why Next.js? | "Single project for both frontend and backend API routes, plus built-in Edge Runtime for low-latency data serving. The file-based routing also mapped cleanly to my page structure." |
| Why Vercel Blob? | "Zero operations overhead. I didn't need a full database since the data is JSON blobs uploaded periodically. Blob storage with CDN gave me fast reads globally without any setup." |
| Why jsPDF client-side? | "Keeping PDF generation on the client means no server load for report generation and no data round-trips. The user's browser already has the data — it just needs to format it." |
| Why no Redux/Zustand? | "Custom hooks were sufficient and kept the dependency footprint minimal. `useDataFetch` covers the data layer, and the data doesn't need to be shared between components that aren't already co-located." |

---

### "What would you improve if you had more time?"

| Improvement | Reason |
|-------------|--------|
| Replace Blob JSON with a proper database (PostgreSQL + Prisma) | Enables historical data, querying, and time-series analysis |
| Add unit tests for Excel parsers | The parsing logic is the most critical and error-prone code |
| Add WebSocket or SSE for real-time updates | Currently requires page refresh to see new data |
| Move rate limiting to Redis | Current in-memory approach resets on cold start |
| Add data validation layer | Currently trusts Excel format is correct; should validate shape before storing |
| Internationalize properly with `next-intl` | Indonesian strings are currently hardcoded |

---

### "How did you handle state management?"

> "I used React's built-in hooks without any external state library. I designed three custom hooks: `useDataFetch` which handles fetching, loading states, errors, and retry logic; `useKeyboardNav` which manages the current page state and wrapping navigation logic; and `useAutoSlide` which handles the 30-second timer and pause/resume for TV mode. The key was keeping concerns separated — components just call these hooks and render what they return, they don't manage the complexity themselves."

---

### "How is the application secured?"

> "The dashboard itself is public — anyone can view the monitoring data, which is intentional for internal broadcasts. The admin upload area is protected by a custom session system using HMAC-SHA256 signed tokens stored in HttpOnly cookies, which prevents JavaScript from reading them and mitigates XSS token theft. There's also IP-based rate limiting on the login endpoint — 5 failed attempts triggers a 15-minute lockout. The session expires after 24 hours and requires re-authentication."

---

### "How did you approach the PDF export feature?"

> "I used jsPDF and jspdf-autotable to generate PDFs entirely in the browser. The key design decision was separating the data formatting from the PDF generation — I wrote formatter functions like `formatNPLKanwilData()` that transform the API response into the column/row structure that autotable expects. This keeps the PDF logic clean and makes it easy to add new export types. The tables use color-coded cells — red for negative performance gaps, green for positive — which the `didParseCell` callback handles by checking the raw cell value."

---

## 10. Glossary

### Indonesian Banking Terms

| Term | Full Name | Meaning |
|------|-----------|---------|
| **BTN** | Bank Tabungan Negara | State-owned Indonesian bank focused on housing and SME loans |
| **SME** | Small-Medium Enterprise | Usaha Kecil Menengah (UKM/UMi) — small business segment |
| **Kanwil** | Kantor Wilayah | Regional Office — BTN has 9 across Indonesia |
| **Cabang** | — | Branch — individual bank branches under each Kanwil |
| **NPL** | Non-Performing Loan | Kredit Macet — loans overdue 90+ days |
| **KOL** | Kolektibilitas | Loan classification tier (1=current, 2=special mention, 3-5=NPL) |
| **KOL 2** | Kolektibilitas 2 | Special mention loans — 30-90 days overdue (early warning) |
| **KUR** | Kredit Usaha Rakyat | Government-subsidized SME loans with lower interest rates |
| **KUMK** | Kredit Usaha Mikro Kecil | Conventional micro/small enterprise loans |
| **KPP** | Kredit Pemilikan Properti | Property ownership loans |
| **Realisasi** | — | Realization/actualization — actual disbursement vs. plan |
| **Posisi** | — | Position — current balance or status at a point in time |
| **MTD** | Month-to-Date | From the 1st of the current month to today |
| **YoY** | Year-over-Year | Same period last year comparison |
| **Gap** | — | Difference/variance — usually current vs. previous period |

### Technical Acronyms

| Term | Meaning |
|------|---------|
| **HMAC** | Hash-based Message Authentication Code — used to sign session tokens |
| **XLSX** | Excel file format (Office Open XML) |
| **Blob** | Binary Large Object — generic term for file storage (here: Vercel Blob) |
| **CDN** | Content Delivery Network — serves files from servers geographically close to users |
| **SSR** | Server-Side Rendering — HTML generated on server before sending to browser |
| **CSR** | Client-Side Rendering — HTML generated in browser via JavaScript |
| **Edge Runtime** | JavaScript runtime that runs at CDN edge nodes, not central data centers |
| **SWC** | Speedy Web Compiler — Rust-based JavaScript/TypeScript compiler used by Next.js |
| **HttpOnly** | Cookie flag preventing JavaScript access (XSS protection) |
| **CSRF** | Cross-Site Request Forgery — attack using authenticated user's cookies |
| **SameSite** | Cookie attribute preventing cross-site requests (CSRF protection) |

---

*Generated: March 2026 | Project: SME Dashboard v1.5 | Stack: Next.js 14 + React 18 + Vercel Blob*

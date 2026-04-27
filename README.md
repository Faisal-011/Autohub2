# AutoHub Manager

A full-stack car dealership management system built with Next.js 15, Supabase, and Genkit AI. Manages inventory, customers, sales, rentals, test drives, and includes an AI-powered car recommendation engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| Database | Supabase (PostgreSQL) |
| AI | Google Genkit + Gemini |
| UI | shadcn/ui, Tailwind CSS, Radix UI |
| Auth (secondary) | Firebase (Firestore rules defined, not active in main flow) |
| Deployment | Firebase App Hosting |

---

## Features

- **Dashboard** — Live stats: total inventory count, total revenue, customer count
- **Inventory** — Add, view, and manage car listings (make, model, year, mileage, price, status)
- **Customers** — Store and manage customer records
- **Sales** — Record sales transactions linked to cars and customers
- **Rentals** — Manage rental agreements and track rental periods
- **Test Drives** — Schedule and track test drives
- **AI Recommendations** — Genkit-powered car recommendations based on budget, seating, fuel efficiency, and desired features

---

## Project Structure

```
src/
├── ai/
│   ├── genkit.ts                          # Genkit + Google AI init
│   └── flows/
│       └── recommend-cars-based-on-needs.ts  # AI recommendation flow
├── app/
│   ├── page.tsx                           # Dashboard (SSR, Supabase)
│   ├── inventory/
│   ├── customers/
│   ├── sales/
│   ├── rentals/
│   ├── test-drives/
│   └── recommendations/
├── components/
│   ├── main-nav.tsx
│   ├── ui/                                # shadcn/ui components
│   └── ...
├── firebase/                              # Firebase client + Firestore hooks
├── lib/
│   ├── actions.ts                         # Server Actions (Supabase CRUD)
│   ├── types.ts                           # Shared TypeScript types
│   ├── data.ts                            # Seed/placeholder data
│   └── supabase/
│       ├── client.ts                      # Browser Supabase client
│       └── server.ts                      # Server Supabase client
supabase/
└── schema.sql                             # Full DB schema (run this first)
firestore.rules                            # Firebase security rules
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (for Genkit)

### 1. Clone & install

```bash
git clone https://github.com/Faisal-011/Autohub2.git
cd Autohub2
npm install
```

### 2. Set up the database

In the Supabase SQL editor, run the full schema:

```bash
# paste contents of supabase/schema.sql into Supabase SQL editor and execute
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google AI (for Genkit recommendations)
GOOGLE_GENAI_API_KEY=your-google-ai-api-key
```

### 4. Run the dev server

```bash
npm run dev
# App runs on http://localhost:9003
```

### 5. (Optional) Run Genkit dev server

To test/inspect the AI recommendation flow:

```bash
npm run genkit:dev
```

---

## Database Schema

| Table | Key Columns |
|---|---|
| `customers` | `id`, `name`, `email`, `phone` |
| `cars` | `id`, `make`, `model`, `year`, `mileage`, `price`, `status`, `image_url` |
| `sales` | `id`, `car_id`, `customer_id`, `sale_date`, `price` |
| `rentals` | `id`, `car_id`, `customer_id`, `start_date`, `end_date`, `total_fee` |
| `test_drives` | `id`, `car_id`, `customer_id`, `date`, `status` |
| `appointments` | `id`, `car_id`, `customer_id`, `date`, `status` |

Car status is an enum: `Available | Sold | Rented | Reserved`

---

## Known Issues & Setup Notes

- **No `.env.local` in repo** — the app will fail to start without Supabase credentials. Create the file as shown above.
- **Firebase config is committed** — `src/firebase/config.ts` contains a real Firebase project's API key. This should be moved to environment variables.
- **`ignoreBuildErrors: true`** is set in `next.config.ts` — TypeScript errors won't block builds, but `npm run typecheck` will surface them.
- **Firebase vs Supabase** — The codebase has both. Supabase is the active data layer (all Server Actions use it). Firebase/Firestore hooks exist (`src/firebase/`) but are not wired into the main app flow. The `firestore.rules` file defines a staff-roles security model that is not currently enforced in the UI.

---

## Deployment

The project is configured for Firebase App Hosting (`apphosting.yaml`, `maxInstances: 1`).

```bash
npm run build
# deploy via Firebase CLI or Firebase App Hosting console
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on port 9003 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run genkit:dev` | Start Genkit dev/inspect server |
| `npm run lint` | ESLint |

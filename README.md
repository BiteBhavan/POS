# 🍔 Bite Bhavan POS

A production-grade cloud kitchen management system built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **Multi-role auth** — Owner, Counter Staff, Kitchen, Delivery
- **New Order** — Direct / Zomato / WhatsApp, dual pricing, per-item notes, address book
- **Order Queue (KDS)** — Real-time kitchen display, color-coded by status
- **Delivery View** — Ready orders, mark delivered
- **Order History** — Search, filter, reprint
- **Inventory** — Stock tracking, purchase entries, reorder alerts, recipe mapping
- **Menu Management** — Dual pricing (Direct + Zomato), availability toggle
- **Expenses** — Daily expense register by category
- **Reports** — P&L, Zomato reconciliation, top items
- **Customers** — Address-based CRM
- **Settings** — Logo upload, commission %, printer IP, user management
- **PWA** — Installs on Android/iPhone, works like native app
- **Thermal Printer** — KOT printing via WiFi ESC/POS

## Tech Stack

| Layer       | Tech                            |
|-------------|----------------------------------|
| Frontend    | Next.js 14 (App Router)         |
| Styling     | Tailwind CSS                    |
| Database    | Supabase (PostgreSQL)           |
| Auth        | Supabase Auth                   |
| State       | Zustand                         |
| Hosting     | Vercel                          |
| Printer     | ESC/POS over TCP                |

## Setup

See [SETUP.md](./SETUP.md) for complete step-by-step deployment instructions.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (app)/                # Protected app routes
│   │   ├── dashboard/
│   │   ├── new-order/
│   │   ├── order-queue/
│   │   ├── order-history/
│   │   ├── delivery/
│   │   ├── inventory/
│   │   ├── menu/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── customers/
│   │   └── settings/
│   └── api/
│       └── print/            # Thermal printer API
├── components/
│   ├── ui/                   # Reusable components
│   └── layout/               # Sidebar, Topbar
├── lib/
│   ├── supabase/             # Client/server/middleware
│   ├── store/                # Zustand stores
│   └── utils.ts
└── types/index.ts
supabase/migrations/001_initial_schema.sql
```

## License

Private — Queen Burger / Bite Bhavan internal use.

# Bite Bhavan POS — Setup Guide

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Vercel](https://vercel.com) account (free tier)
- A [GitHub](https://github.com) account

---

## Step 1 — Push to GitHub

```bash
cd bitebhavan-pos
git init
git add .
git commit -m "Initial commit — Bite Bhavan POS v1"
git remote add origin https://github.com/YOUR_USERNAME/bitebhavan-pos.git
git push -u origin main
```

---

## Step 2 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `bitebhavan-pos` | Password: (save it) | Region: South Asia (Mumbai)
3. Once created → **SQL Editor** → **New Query**
4. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run**
6. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### Create First User (Owner)
In Supabase → Authentication → Users → Add User:
- Email: `azeem@bitebhavan.internal`
- Password: (your password)
- Then in SQL Editor run:
```sql
INSERT INTO users (auth_id, name, username, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'azeem@bitebhavan.internal'),
  'Azeem', 'azeem', 'owner'
);
```

### Storage Bucket (for logo)
Go to **Storage → New Bucket** → Name: `logos` → Public: YES

---

## Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo `bitebhavan-pos`
3. Framework: **Next.js** (auto-detected)
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY      = eyJhbGci...
   ```
5. Click **Deploy**

---

## Step 4 — Custom Domain

In your domain registrar (GoDaddy / Namecheap), add:
```
Type:   CNAME
Name:   app
Value:  cname.vercel-dns.com
```

In Vercel → Project → Settings → Domains → Add `app.bitebhavan.com`

---

## Step 5 — Install as PWA on Phone

**Android (Chrome):**
1. Open `https://app.bitebhavan.com` in Chrome
2. Three dots menu → **Add to Home Screen**

**iPhone (Safari):**
1. Open `https://app.bitebhavan.com` in Safari
2. Share button → **Add to Home Screen**

---

## Step 6 — Thermal Printer Setup

1. Connect ESC/POS WiFi printer to same WiFi network as phones
2. Note its IP address (check router admin page)
3. In POS → Settings → Printer → Enter IP → Test Print

---

## Adding More Users

In POS → Settings → Users & Roles → Add User

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase keys
npm install
npm run dev
```

Open http://localhost:3000

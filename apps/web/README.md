# SilverLine B2B Platform

A Next.js B2B reseller platform with separate admin and reseller portals.

## Features

- **Admin Portal** (`/admin/*`)
  - Role-based authentication
  - Sidebar navigation
  - Dashboard, Products, Orders, Resellers, Settings pages

- **Reseller Portal** (`/reseller/*`)
  - Role-based authentication
  - Top header navigation
  - Dashboard, Catalog, Orders, Profile pages

- **Authentication**
  - Supabase Auth integration
  - Browser and server-side clients
  - Role guards (admin/reseller/pending)

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
- React Query
- Zod
- React Hook Form
- Zustand

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Database Setup

Create a `profiles` table in Supabase with the following structure:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'reseller', 'pending')) default 'pending',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Profiles are viewable by users who created them"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

## Routes

- `/` - Home page with login links
- `/login` - Reseller login
- `/register` - Reseller registration
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/reseller/dashboard` - Reseller dashboard

## Project Structure

```
apps/web/
├── app/
│   ├── (admin)/admin/        # Admin route group
│   ├── (reseller)/reseller/  # Reseller route group
│   ├── login/                # Public reseller login
│   ├── register/             # Public reseller registration
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── lib/
│   ├── supabase-browser.ts   # Browser Supabase client
│   ├── supabase-server.ts    # Server Supabase client
│   └── roles.ts              # Role guards and types
└── package.json
```

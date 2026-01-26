# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SousedePujc is a Czech peer-to-peer item lending/borrowing platform. Users list items for rent, browse listings, request bookings, and communicate via integrated messaging. The UI is in Czech.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: TailwindCSS + Radix UI (shadcn/ui style components)
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

### Data Flow

All data operations go directly through the Supabase client - there's no backend API layer. Row Level Security (RLS) policies in Supabase enforce access control.

### Key Directories

- `app/` - Next.js App Router pages and layouts
- `lib/` - Core business logic
  - `auth.tsx` - AuthContext with React Context API, handles login/register/session
  - `database.ts` - Supabase query functions with caching (items: 30s, categories: 5min)
  - `supabase.ts` - Supabase client configuration
  - `types.ts` - TypeScript interfaces for all entities
  - `content-filter.ts` - Chat message content moderation
- `components/` - Reusable UI organized by domain (chat/, items/, bookings/, ui/, etc.)
- `sql/` - Database schema and seed data for Supabase

### Database Schema (key tables)

```
users → items → bookings → chat_rooms → chat_messages
          ↓                     ↓
     categories            message_reactions
                          → notifications
                          → reviews
```

### Authentication Pattern

- Email/password via Supabase Auth with email verification required
- Session stored in localStorage with browser-specific key
- `useAuth()` hook provides current user throughout the app
- Auth state synced between Supabase Auth and local `users` table

### Real-time Features

Chat messages and notifications use Supabase Realtime subscriptions:
```typescript
supabase.channel('name').on('postgres_changes', {...}).subscribe()
```
Always clean up channels on unmount: `supabase.removeChannel(channel)`

### Component Patterns

- Client components use `"use client"` directive
- Data loading via `useState` + `useEffect`
- Auth walls via `useAuth()` hook conditional rendering
- Loading states via Suspense boundaries and `loading.tsx` files

## Path Aliases

`@/*` maps to the project root (configured in tsconfig.json)

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Cron Jobs

A daily keep-alive endpoint runs at 8:00 UTC to ping the database (configured in `vercel.json`).

# ChitMate

ChitMate is a dual-portal chit fund platform for organisers and members, built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

## Product Overview

The repo follows a `src`-based structure:

- `src/app` for routes and layouts
- `src/components` for shared UI
- `src/config` for site metadata
- `src/lib` for framework-agnostic utilities
- `src/modules` for domain logic
- `src/utils/supabase` for auth, session, and data helpers
- `supabase/schema.sql` for the current database reference schema

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

## Current Focus

- organiser phone OTP access
- token-based member portal access
- organiser-owned chit group operations
- Digital Ledger design system rollout
- Supabase-only data migration

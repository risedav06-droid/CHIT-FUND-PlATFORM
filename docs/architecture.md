# ChitMate Architecture

This repo uses a `src`-first structure aligned with the Next.js App Router and a Supabase backend.

## Current implementation

```text
src/
  app/
  components/
  config/
  lib/
  modules/
  server/
  utils/
    supabase/
supabase/
  schema.sql
```

## Rules of thumb

- Keep route files in `src/app`
- Put reusable UI in `src/components`
- Put domain-specific logic in `src/modules`
- Keep Supabase helpers in `src/utils/supabase`
- Keep server-only env validation in `src/server`

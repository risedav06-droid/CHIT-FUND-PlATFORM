# ChitFlow Architecture

This repo now uses a `src`-first structure aligned with the Next.js 16 App Router.

## Current implementation

```text
src/
  app/
  components/
    providers/
  config/
  lib/
  server/
    db/
```

## Target scalable structure

```text
src/
  app/
    (marketing)/
    (auth)/
    (platform)/
    api/
  components/
    layout/
    providers/
    shared/
    ui/
  config/
  lib/
  modules/
    auth/
    auctions/
    chit-funds/
    collections/
    members/
    reports/
    settings/
  server/
    db/
    repositories/
    services/
  types/
  generated/
    prisma/
prisma/
  schema.prisma
```

## Rules of thumb

- Keep route files in `src/app`
- Put reusable UI in `src/components`
- Put domain-specific logic in `src/modules`
- Keep database and env code in `src/server`
- Treat `src/generated/prisma` as generated code only

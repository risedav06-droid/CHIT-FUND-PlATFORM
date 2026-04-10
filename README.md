# ChitFlow Platform

ChitFlow is a chit fund management platform built with Next.js 16, TypeScript, Tailwind CSS v4, and Prisma.

## Foundation Status

The repo now follows a scalable `src`-based architecture:

- `src/app` for routes and layouts
- `src/components` for shared UI and providers
- `src/config` for site and navigation config
- `src/lib` for framework-agnostic utilities
- `src/server` for server-only env and database code
- `src/generated/prisma` for the generated Prisma client

The target folder plan is documented in `docs/architecture.md`.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
Copy-Item .env.example .env
```

3. Generate the Prisma client:

```bash
npx prisma generate
```

4. Start the app:

```bash
npm run dev
```

## Next Steps

- Add Prisma models and migrations for chit funds, members, installments, auctions, and collections
- Introduce authentication and role-based access
- Build feature modules incrementally inside `src/modules`

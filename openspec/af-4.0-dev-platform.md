# AF-4.0 Developer Platform (Sprint 7)

## Quick start (<15 min target)

```bash
git clone <repo>
cd kadarn-platform
npm ci
npx supabase start          # local DB
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
npm run dev:api             # :3001
npm run dev                 # :3000 web
npm run seed:users -w tests # test users
```

## CLI

```bash
npm run build -w @kadarn/cli
npx kadarn doctor
npx kadarn seed
```

## Dev Container

Open in VS Code / Cursor → "Reopen in Container" (`.devcontainer/`)

## One-command (partial)

```bash
docker compose -f docker-compose.dev.yml up -d
npm run dev:api & npm run dev
```

## Gate

- [x] CONTRIBUTING updated
- [x] CLI scaffold
- [x] Devcontainer + docker-compose
- [ ] Timed onboarding run on fresh machine

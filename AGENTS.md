# MeseroApp

Restaurant management PWA built with React, TypeScript, Vite, and Supabase.

## Stack

- React 18, TypeScript, Vite 5
- Tailwind CSS, Lucide icons
- Supabase (auth, database, storage, realtime)
- PWA with service worker (vite-plugin-pwa)
- Deployed on Vercel

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Type check + production build
- `npm run lint` - ESLint
- `npm run preview` - Preview production build

## Structure

- `App.tsx` - Root router
- `index.tsx` - Entry point
- `views/` - Page components (Login, Register, Dashboard, Landing, etc.)
- `components/` - Reusable UI components (Button, Input, etc.)
- `services/` - Supabase client, auth, database operations
- `store/` - AppContext (global state with React Context)
- `hooks/` - Custom hooks
- `utils/` - Helpers (image optimizer, etc.)
- `types.ts` - Shared TypeScript types
- `config/` - App constants

## Conventions

- Functional components with React.FC
- Tailwind utility classes (no CSS modules)
- Supabase for all data/storage
- Views receive `onNavigate` prop for routing
- Prevent default browser behavior on relevant touch events
- All text in Spanish (app UI)
- Imports: React/libraries first, then project modules (no blank line between)
- Dark theme with brand-900 (black) and accent-500 (gold)

## Agents

### Testing
- Description: Run tests, check for type errors, and verify builds
- Permissions: bash, read, glob, grep
- Commands: npm run build, npm run lint

### Database
- Description: Manage Supabase migrations and SQL queries
- Permissions: read, write, edit, glob, grep, bash
- Prompt: You manage Supabase schema. Use the migrations/ folder for SQL files. Apply changes via Supabase SQL editor or migration files. Verify with getProfile queries.

### Review
- Description: Review code for bugs, performance issues, and adherence to project conventions
- Permissions: read, glob, grep
- Prompt: You are a code reviewer. Verify Tailwind class usage, TypeScript types, Supabase query patterns, and React best practices. Do not edit files.

### Deploy
- Description: Build, deploy to Vercel, and verify deployments
- Permissions: read, bash
- Prompt: Run npm run build first, then use Vercel CLI to deploy. Verify deployment status with vercel inspect.

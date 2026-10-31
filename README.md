# Launchpad by Progeta Technologies

Launchpad is a learning and certification platform centered on reusable digital learning assets—courses, lessons, quizzes, certificates, resources, and live classes. It provides learner, teacher, and administrator areas for delivering and managing learning programs.

## Platform features

- Course and module catalog, enrollment/checkout, lessons, and downloadable resources.
- Certification paths, quizzes, exam sessions, and certificates.
- Learner dashboard, class participation, live classes, and mentoring.
- Teacher tools for courses, cohorts, students, coupons, communication, and assessments.
- Administrative controls for users, settings, audit records, events, and content.

## Technology

Launchpad uses SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS, and Drizzle ORM. Neon PostgreSQL stores application data; Better Auth handles authentication; Cashfree provides payments; Resend provides transactional email. File storage supports local development and optional Cloudflare R2 or Supabase Storage providers.

## Local development

Requires Node.js and npm. From this directory:

```sh
npm install
cp .env.example .env
# Add the database/auth values required for your local environment.
npm run dev
```

Vite prints the local URL. Check types and Svelte components with `npm run check`; create a production build with `npm run build` and inspect it using `npm run preview`.

## Database and scripts

Configure `DATABASE_URL` and `BETTER_AUTH_SECRET` first. `.env.example` lists OAuth, Cashfree sandbox, Resend, and storage settings; leave optional providers disabled until configured. Never commit `.env` or production secrets.

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Generate Drizzle migrations from schema changes. |
| `npm run db:migrate` | Apply checked-in migrations. |
| `npm run db:push` | Push schema changes directly for local development. |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:seed` | Seed the configured database with demo content. |

Use `db:push` only against a development database. Review migration files before applying changes to shared or production data. The Cloudflare deployment is configured in `wrangler.json`; the adapter and bindings must match the chosen deployment environment.

## Code map

- `src/routes/` — public catalog, learner, teacher, admin, auth, checkout, and API routes.
- `src/lib/server/` — auth, payments, storage, mail, database, and business services.
- `src/lib/` — shared UI, validation, and client utilities.
- `scripts/` — database/content and storage maintenance utilities.
- `static/` — public assets.

## Validation

The package exposes `npm run check` but does not currently define an automated test script. Verify a feature with the checks and workflows that apply to it, especially sign-in, payment sandbox callbacks, upload providers, and role-protected pages.

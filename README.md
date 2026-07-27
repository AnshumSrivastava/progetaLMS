# Launchpad

Launchpad is a modern learning, certification, and mentoring platform built by Progeta Technologies. It focuses on the ownership of digital assets (PDFs, HTML, Markdown, external links, etc.) rather than traditional video courses.

## Architecture

- **Framework**: SvelteKit 2 (Svelte 5 runes mode)
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Auth**: Better Auth (Google OAuth + Email OTP via Resend)
- **Payments**: Cashfree (API v3)
- **Storage**: Provider-agnostic storage layer (Local by default, supports Cloudflare R2 and Supabase)
- **Event Bus**: Transactional Outbox pattern for reliable async side effects

### Provider-Agnostic Storage Architecture

Launchpad implements a decoupled storage architecture to ensure flexibility. The application never interacts directly with cloud storage APIs.

- **StorageService**: The single source of truth for all file operations in the domain layer.
- **Providers**: Implement the `IStorageProvider` interface. 
- **Database tracking**: Every uploaded file is tracked in the `storage_objects` table, including metadata like `mime_type`, `size_bytes`, and a SHA-256 `checksum`. Asset records reference the `public_url`.

By default, the application runs on **Local Storage**, meaning developers can clone the repository and run the application without setting up any cloud storage accounts.

Supported Providers:
1. `local` (Default, uses the local filesystem)
2. `r2` (Cloudflare R2, S3 compatible)
3. `supabase` (Supabase Storage)

## Setup Instructions

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in the database URL and authentication secrets in `.env`. By default, `UPLOAD_PROVIDER=local` is set, which requires no additional configuration.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration & Seeding
Generate the migration SQL, apply it to your Neon database, and seed the default roles and capabilities:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Deployment Guide

Launchpad is optimized for edge deployment (e.g., Cloudflare Pages) using `@sveltejs/adapter-cloudflare`.

### Storage Migration to Cloud
When you are ready to move from Local Storage to Cloudflare R2 (or Supabase), you do not need to change any business logic or database schemas. 

1. Setup an R2 Bucket or Supabase Storage bucket.
2. Update your `.env` with the provider credentials (e.g., `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, etc.).
3. Run the storage migration script to automatically move local files to your new provider and update the tracking records:
```bash
MIGRATE_FROM=local MIGRATE_TO=r2 npx tsx scripts/migrate-storage.ts
```
4. Set `UPLOAD_PROVIDER=r2` in your production environment variables.

### Environment Variables
For production deployment, ensure all variables in `.env.example` are set in your provider's dashboard (e.g., Cloudflare Pages settings), particularly:
- `DATABASE_URL` (Use the pooled connection string)
- `BETTER_AUTH_SECRET`
- `CASHFREE_SECRET_KEY`
- `RESEND_API_KEY`
- Storage variables corresponding to your chosen `UPLOAD_PROVIDER`.

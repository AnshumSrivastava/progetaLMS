/**
 * Drizzle ORM + Neon PostgreSQL client.
 *
 * Uses @neondatabase/serverless for HTTP-based Postgres queries —
 * required for Cloudflare Workers (no raw TCP sockets allowed).
 *
 * This is a singleton instance. All domain repositories import `db` from here.
 * No repository should create its own connection.
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { DATABASE_URL } from '$env/static/private';

// Import all schemas so Drizzle can resolve relations
import * as schema from './schema/index';

const pool = new Pool({ connectionString: DATABASE_URL });

export const db = drizzle(pool, {
	schema,
	logger: process.env.NODE_ENV === 'development'
});

export type Database = typeof db;

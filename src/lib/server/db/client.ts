/**
 * Drizzle ORM + Neon PostgreSQL client.
 *
 * Uses @neondatabase/serverless for HTTP-based Postgres queries —
 * required for Cloudflare Workers (no raw TCP sockets allowed).
 *
 * This is a singleton instance. All domain repositories import `db` from here.
 * No repository should create its own connection.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_URL } from '$env/static/private';

// Import all schemas so Drizzle can resolve relations
import * as schema from './schema/index';

const sql = neon(DATABASE_URL);

export const db = drizzle(sql, {
	schema,
	logger: process.env.NODE_ENV === 'development'
});

export type Database = typeof db;

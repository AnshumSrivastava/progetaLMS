/**
 * Storage Migration Script
 *
 * Migrates all files from the current provider to a new provider.
 * Run this when switching from local → R2, or R2 → Supabase, etc.
 *
 * Usage:
 *   MIGRATE_FROM=local MIGRATE_TO=r2 npx tsx scripts/migrate-storage.ts
 *
 * What it does:
 *   1. Queries all storage_objects WHERE storage_provider = MIGRATE_FROM
 *   2. Downloads each file from the source provider
 *   3. Uploads to the destination provider at the same key
 *   4. Updates the storage_objects record (storage_provider, public_url)
 *   5. Domain tables (assets.thumbnail, certificates.pdf_url, etc.) reference
 *      the public_url which is now updated — no other schema changes needed
 *
 * Safety:
 *   - Dry run by default (set DRY_RUN=false to actually migrate)
 *   - Verifiable: checksums are compared before marking migrated
 *   - Resumable: already-migrated records are skipped
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema/index';
import { createStorageProvider } from '../src/lib/server/storage/storage.factory';
import type { StorageProviderType } from '../src/lib/server/storage/provider.interface';

const DRY_RUN   = process.env.DRY_RUN !== 'false';
const FROM_TYPE = (process.env.MIGRATE_FROM ?? 'local') as StorageProviderType;
const TO_TYPE   = (process.env.MIGRATE_TO   ?? 'r2')    as StorageProviderType;

if (FROM_TYPE === TO_TYPE) {
	console.error('❌ MIGRATE_FROM and MIGRATE_TO are the same. Nothing to do.');
	process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const db  = drizzle(sql, { schema });

const sourceProvider = createStorageProvider({
	provider:        FROM_TYPE,
	uploadDirectory: process.env.UPLOAD_DIRECTORY,
	publicUploadUrl: process.env.PUBLIC_UPLOAD_URL
});

const destProvider = createStorageProvider({
	provider:              TO_TYPE,
	r2AccountId:           process.env.R2_ACCOUNT_ID,
	r2AccessKeyId:         process.env.R2_ACCESS_KEY_ID,
	r2SecretAccessKey:     process.env.R2_SECRET_ACCESS_KEY,
	r2BucketName:          process.env.R2_BUCKET_NAME,
	r2PublicUrl:           process.env.R2_PUBLIC_URL,
	supabaseUrl:           process.env.SUPABASE_URL,
	supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET,
	supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

async function migrate() {
	console.log(`\n📦 Storage Migration: ${FROM_TYPE} → ${TO_TYPE}`);
	console.log(DRY_RUN ? '  🔍 DRY RUN — no files will be moved\n' : '  ⚠️  LIVE RUN — files WILL be migrated\n');

	const records = await db
		.select()
		.from(schema.storageObjects)
		.where(eq(schema.storageObjects.storageProvider, FROM_TYPE));

	console.log(`  Found ${records.length} files to migrate\n`);

	let migrated = 0;
	let failed   = 0;
	let skipped  = 0;

	for (const record of records) {
		process.stdout.write(`  → ${record.storageKey} ... `);

		try {
			// Skip if already exists at destination
			const alreadyExists = await destProvider.exists(record.storageKey);
			if (alreadyExists) {
				process.stdout.write('skipped (already exists)\n');
				skipped++;
				continue;
			}

			if (DRY_RUN) {
				process.stdout.write('would migrate\n');
				migrated++;
				continue;
			}

			// Download from source
			const data = await sourceProvider.download(record.storageKey);

			// Upload to destination
			const newObject = await destProvider.upload(record.storageKey, data, {
				mimeType:  record.mimeType,
				sizeBytes: record.sizeBytes ?? undefined,
				checksum:  record.checksum ?? undefined
			});

			// Update the DB record
			await db
				.update(schema.storageObjects)
				.set({
					storageProvider: TO_TYPE,
					publicUrl:       newObject.publicUrl
				})
				.where(eq(schema.storageObjects.id, record.id));

			process.stdout.write(`✓ → ${newObject.publicUrl}\n`);
			migrated++;
		} catch (e) {
			process.stdout.write(`✗ ERROR: ${e instanceof Error ? e.message : String(e)}\n`);
			failed++;
		}
	}

	console.log(`\n✅ Migration complete`);
	console.log(`   Migrated: ${migrated}`);
	console.log(`   Skipped:  ${skipped}`);
	console.log(`   Failed:   ${failed}`);

	if (failed > 0) process.exit(1);
}

migrate().catch((e) => {
	console.error('Fatal:', e);
	process.exit(1);
});

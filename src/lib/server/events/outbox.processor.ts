/**
 * Outbox Processor
 *
 * Reads pending events from the outbox and dispatches them via the EventBus.
 *
 * Deployment strategy for Cloudflare Pages (MVP):
 *   Called at the beginning of every incoming request in hooks.server.ts.
 *   Processes up to BATCH_SIZE events per request.
 *   Uses platform.context.waitUntil() so processing doesn't add to response latency.
 *
 * Future: Replace with a dedicated Cloudflare Worker cron for high-volume scenarios.
 *
 * At-least-once guarantee:
 *   If a handler throws, the event is marked failed with error detail.
 *   Events with attempts < MAX_ATTEMPTS are retried on the next process pass.
 */
import type { Database } from '../db/client';
import { OutboxRepository } from './outbox.repository';
import { eventBus } from './event-bus';
import type { DomainEvent } from '$shared/types/events';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

export async function processOutbox(db: Database): Promise<void> {
	const repo = new OutboxRepository(db);
	const pending = await repo.fetchPending(BATCH_SIZE);

	for (const record of pending) {
		// Skip events that have exceeded max attempts
		if (record.attempts >= MAX_ATTEMPTS) continue;

		try {
			const event: DomainEvent = {
				type:       record.eventType,
				payload:    record.payload,
				occurredAt: record.createdAt!
			};

			await eventBus.dispatch(record.id, event);
			await repo.markProcessed(record.id);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`[OutboxProcessor] Failed to process event ${record.id} (${record.eventType}):`, message);
			await repo.markFailed(record.id, message);
		}
	}
}

/**
 * Event Outbox Repository
 *
 * Handles persistence of domain events to the transactional outbox table.
 * Events are always written within the same DB transaction as the state change.
 */
import { eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { eventOutbox, type NewEventOutboxRecord, type EventOutboxRecord } from '../db/schema/outbox.schema';
import type { DomainEvent } from '$shared/types/events';
import { generateId } from '$shared/utils/id';

export class OutboxRepository {
	constructor(private readonly db: Database) {}

	/**
	 * Persist a domain event to the outbox.
	 * Call this INSIDE the same transaction as your state change.
	 */
	async append(event: DomainEvent, tx?: Database): Promise<void> {
		const target = tx ?? this.db;
		const record: NewEventOutboxRecord = {
			id:        generateId(),
			eventType: event.type,
			payload:   event.payload as Record<string, unknown>,
			attempts:  0
		};
		await target.insert(eventOutbox).values(record);
	}

	/**
	 * Fetch a batch of unprocessed events (for the processor).
	 * Ordered by createdAt ASC to process in order.
	 */
	async fetchPending(limit = 20): Promise<EventOutboxRecord[]> {
		return this.db
			.select()
			.from(eventOutbox)
			.where(isNull(eventOutbox.processedAt))
			.orderBy(eventOutbox.createdAt)
			.limit(limit);
	}

	/** Mark an event as successfully processed */
	async markProcessed(id: string): Promise<void> {
		await this.db
			.update(eventOutbox)
			.set({ processedAt: new Date() })
			.where(eq(eventOutbox.id, id));
	}

	/** Mark an event as failed (will be retried up to MAX_ATTEMPTS) */
	async markFailed(id: string, error: string): Promise<void> {
		await this.db
			.update(eventOutbox)
			.set({
				failedAt: new Date(),
				error,
				attempts: sql`${eventOutbox.attempts} + 1`
			})
			.where(eq(eventOutbox.id, id));
	}
}

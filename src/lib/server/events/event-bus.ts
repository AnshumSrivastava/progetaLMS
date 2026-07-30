/**
 * Domain Event Bus
 *
 * In-process event dispatcher. Handlers are registered by event type.
 * The processor reads from the outbox and calls dispatch() for each event.
 *
 * Design:
 * - Events are NOT dispatched inline in service methods.
 *   They are written to the outbox first (atomically), then dispatched here.
 * - This makes the system resilient: if dispatch fails, the event is still
 *   in the outbox and will be retried.
 * - Handlers are registered once at application startup (in hooks.server.ts).
 */
import type { DomainEvent, DomainEventType } from '$shared/types/events';

export type EventHandler<TPayload = unknown> = (
	payload: TPayload,
	meta: { eventId: string; occurredAt: Date }
) => Promise<void>;

class EventBus {
	private handlers = new Map<string, EventHandler<any>[]>();

	/** Clear all registered handlers (useful for HMR in dev) */
	clear(): void {
		this.handlers.clear();
	}

	/** Register a handler for an event type (can have multiple per type) */
	on<TPayload>(eventType: string, handler: EventHandler<TPayload>): void {
		const existing = this.handlers.get(eventType) ?? [];
		this.handlers.set(eventType, [...existing, handler]);
	}

	/** Dispatch an event to all registered handlers */
	async dispatch(eventId: string, event: DomainEvent): Promise<void> {
		const handlers = this.handlers.get(event.type) ?? [];
		if (handlers.length === 0) {
			console.warn(`[EventBus] No handlers registered for event type: ${event.type}`);
			return;
		}

		const meta = { eventId, occurredAt: event.occurredAt };

		// Handlers run sequentially to avoid partial failures going undetected.
		// If any handler throws, the processor will mark the event as failed
		// and retry later. This preserves at-least-once delivery.
		for (const handler of handlers) {
			await handler(event.payload, meta);
		}
	}

	/** Check if any handlers exist for an event type */
	hasHandlers(eventType: string): boolean {
		return (this.handlers.get(eventType) ?? []).length > 0;
	}
}

/** Singleton event bus — module-level singleton (one per Worker instance) */
export const eventBus = new EventBus();

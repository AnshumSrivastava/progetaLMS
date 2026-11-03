import { db } from '$lib/server/db/client';
import { userCredits, creditTransactions, creditPackages } from '$lib/server/db/schema/credits.schema';
import { events, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export class CreditService {
	/**
	 * Get current credit balance for a user.
	 * If user has no balance record yet, returns 0 balance without failing.
	 */
	static async getBalance(userId: string) {
		const [credit] = await db
			.select()
			.from(userCredits)
			.where(eq(userCredits.userId, userId));

		return {
			balance: credit ? credit.balance : 0,
			lifetimeEarned: credit ? credit.lifetimeEarned : 0,
			lifetimeSpent: credit ? credit.lifetimeSpent : 0
		};
	}

	/**
	 * Atomically add credits (e.g., from purchase, refund, or admin grant).
	 * Enforces idempotency if key provided.
	 */
	static async addCredits(
		userId: string,
		amount: number,
		options: {
			type: 'purchase' | 'bonus' | 'refund' | 'adjustment';
			referenceId?: string;
			referenceType?: string;
			description: string;
			idempotencyKey?: string;
		}
	) {
		if (amount <= 0) {
			throw new Error('Credit amount must be greater than zero');
		}

		return await db.transaction(async (tx) => {
			// Idempotency check
			if (options.idempotencyKey) {
				const [existingTx] = await tx
					.select()
					.from(creditTransactions)
					.where(eq(creditTransactions.idempotencyKey, options.idempotencyKey));

				if (existingTx) {
					console.log(`[CreditService] Transaction ${options.idempotencyKey} already processed.`);
					return { balance: existingTx.balanceAfter, alreadyProcessed: true };
				}
			}

			// Lock or create user_credits row
			const [locked] = await tx
				.select()
				.from(userCredits)
				.where(eq(userCredits.userId, userId))
				.for('update');

			const currentBalance = locked ? locked.balance : 0;
			const newBalance = currentBalance + amount;
			const txId = createId();

			if (!locked) {
				await tx.insert(userCredits).values({
					id: createId(),
					userId,
					balance: newBalance,
					lifetimeEarned: amount,
					lifetimeSpent: 0,
					updatedAt: new Date()
				});
			} else {
				await tx
					.update(userCredits)
					.set({
						balance: newBalance,
						lifetimeEarned: sql`${userCredits.lifetimeEarned} + ${amount}`,
						updatedAt: new Date()
					})
					.where(eq(userCredits.userId, userId));
			}

			await tx.insert(creditTransactions).values({
				id: txId,
				userId,
				type: options.type,
				amount,
				balanceBefore: currentBalance,
				balanceAfter: newBalance,
				referenceId: options.referenceId,
				referenceType: options.referenceType,
				description: options.description,
				idempotencyKey: options.idempotencyKey,
				createdAt: new Date()
			});

			return { balance: newBalance, alreadyProcessed: false };
		});
	}

	/**
	 * Atomically deduct credits to register for an event.
	 * Pessimistic locking (FOR UPDATE) prevents double-spending.
	 */
	static async spendCreditsForEvent(userId: string, eventId: string) {
		return await db.transaction(async (tx) => {
			// 1. Fetch Event and verify eligibility
			const [event] = await tx
				.select()
				.from(events)
				.where(eq(events.id, eventId));

			if (!event || event.status !== 'published') {
				throw new Error('Event is not available for registration');
			}

			if (new Date() > new Date(event.registrationDeadline)) {
				throw new Error('Registration for this event has closed');
			}

			if (new Date() > new Date(event.startAt)) {
				throw new Error('Event has already started');
			}

			if (event.priceCredits === null || event.priceCredits === undefined || event.priceCredits <= 0) {
				throw new Error('This event cannot be booked with credits');
			}

			const cost = event.priceCredits;

			// 2. Check seat capacity if configured
			if (event.maxAttendees !== null && event.maxAttendees !== undefined) {
				const [{ count }] = await tx
					.select({ count: sql<number>`count(*)` })
					.from(eventRegistrations)
					.where(and(
						eq(eventRegistrations.eventId, eventId),
						eq(eventRegistrations.status, 'confirmed')
					));

				if (Number(count) >= event.maxAttendees) {
					throw new Error('This event has reached full capacity');
				}
			}

			// 3. Check for existing registration
			const [existing] = await tx
				.select()
				.from(eventRegistrations)
				.where(and(
					eq(eventRegistrations.eventId, eventId),
					eq(eventRegistrations.userId, userId)
				));

			if (existing) {
				if (existing.status === 'confirmed') {
					throw new Error('You are already registered for this event');
				}
			}

			// 4. Lock credit row with FOR UPDATE
			const [locked] = await tx
				.select()
				.from(userCredits)
				.where(eq(userCredits.userId, userId))
				.for('update');

			const currentBalance = locked ? locked.balance : 0;
			if (currentBalance < cost) {
				throw new Error(`Insufficient credits. Required: ${cost}, Available: ${currentBalance}`);
			}

			const newBalance = currentBalance - cost;
			const registrationId = existing ? existing.id : createId();
			const txId = createId();

			// 5. Deduct credits
			await tx
				.update(userCredits)
				.set({
					balance: newBalance,
					lifetimeSpent: sql`${userCredits.lifetimeSpent} + ${cost}`,
					updatedAt: new Date()
				})
				.where(eq(userCredits.userId, userId));

			// 6. Log transaction ledger
			await tx.insert(creditTransactions).values({
				id: txId,
				userId,
				type: 'spend',
				amount: -cost,
				balanceBefore: currentBalance,
				balanceAfter: newBalance,
				referenceId: registrationId,
				referenceType: 'event_registration',
				description: `Registration for ${event.title}`,
				idempotencyKey: `SPEND_EVENT_${eventId}_${userId}`,
				createdAt: new Date()
			});

			// 7. Insert or update registration
			if (existing) {
				await tx
					.update(eventRegistrations)
					.set({
						status: 'confirmed',
						paymentMethod: 'credit',
						amountPaidPaise: 0,
						creditsUsed: cost,
						registeredAt: new Date()
					})
					.where(eq(eventRegistrations.id, existing.id));
			} else {
				await tx.insert(eventRegistrations).values({
					id: registrationId,
					eventId,
					userId,
					status: 'confirmed',
					paymentMethod: 'credit',
					amountPaidPaise: 0,
					creditsUsed: cost,
					registeredAt: new Date()
				});
			}

			return {
				registrationId,
				event,
				creditsSpent: cost,
				remainingBalance: newBalance
			};
		});
	}

	/**
	 * Get recent transactions for a user
	 */
	static async getTransactions(userId: string, limit: number = 20, offset: number = 0) {
		return await db
			.select()
			.from(creditTransactions)
			.where(eq(creditTransactions.userId, userId))
			.orderBy(desc(creditTransactions.createdAt))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * Get active packages for students
	 */
	static async getActivePackages() {
		return await db
			.select()
			.from(creditPackages)
			.where(eq(creditPackages.isActive, true))
			.orderBy(creditPackages.sortOrder);
	}
}


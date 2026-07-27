/**
 * Domain Event base type and registry.
 *
 * Domain events are the backbone of the event-driven architecture.
 * When a significant business action occurs (payment completed, quiz passed, etc.),
 * a domain event is persisted to the event_outbox table within the same DB transaction.
 * A processor then handles each event asynchronously.
 *
 * Rule: Events are past-tense facts. They describe what happened, not what to do next.
 */

export interface DomainEvent<TType extends string = string, TPayload = unknown> {
	/** Unique event type identifier — used to route to the correct handler */
	type: TType;
	/** Event payload — must be serializable to JSON */
	payload: TPayload;
	/** When the event occurred (not when it is processed) */
	occurredAt: Date;
}

/** All domain event types (exhaustive registry) */
export const DomainEventType = {
	// Commerce
	PAYMENT_COMPLETED:    'PaymentCompleted',
	PAYMENT_REFUNDED:     'PaymentRefunded',
	COUPON_APPLIED:       'CouponApplied',

	// Assets
	OWNERSHIP_GRANTED:    'OwnershipGranted',
	OWNERSHIP_REVOKED:    'OwnershipRevoked',
	ASSET_PUBLISHED:      'AssetPublished',

	// Assessments
	QUIZ_PASSED:          'QuizPassed',
	QUIZ_FAILED:          'QuizFailed',
	ATTEMPT_STARTED:      'AttemptStarted',
	ATTEMPT_SUBMITTED:    'AttemptSubmitted',

	// Certificates
	CERTIFICATE_ISSUED:   'CertificateIssued',
	CERTIFICATE_REVOKED:  'CertificateRevoked',

	// Mentoring
	SESSION_BOOKED:       'SessionBooked',
	SESSION_CANCELLED:    'SessionCancelled',
	SESSION_COMPLETED:    'SessionCompleted',

	// Identity
	USER_REGISTERED:      'UserRegistered',
} as const;

export type DomainEventType = typeof DomainEventType[keyof typeof DomainEventType];

// ─── Typed Event Payloads ────────────────────────────────────────────────────

export interface PaymentCompletedPayload {
	orderId: string;
	userId: string;
	assetId: string;
	amountPaise: number;
	cashfreeOrderId: string;
}

export interface OwnershipGrantedPayload {
	ownershipId: string;
	userId: string;
	assetId: string;
	source: 'purchase' | 'grant' | 'free' | 'coupon';
	orderId: string | null;
}

export interface QuizPassedPayload {
	attemptId: string;
	userId: string;
	testId: string;
	score: number;
	maxScore: number;
	passingPercent: number;
}

export interface QuizFailedPayload {
	attemptId: string;
	userId: string;
	testId: string;
	score: number;
	maxScore: number;
}

export interface CertificateIssuedPayload {
	certificateId: string;
	userId: string;
	testId: string;
	pdfUrl: string;
	verifyUrl: string;
}

export interface SessionBookedPayload {
	bookingId: string;
	slotId: string;
	studentId: string;
	instructorId: string;
	startsAt: string; // ISO string
}

export interface UserRegisteredPayload {
	userId: string;
	email: string;
	name: string;
}

// ─── Typed Event Constructors ─────────────────────────────────────────────────

export function createDomainEvent<T extends string, P>(
	type: T,
	payload: P
): DomainEvent<T, P> {
	return { type, payload, occurredAt: new Date() };
}

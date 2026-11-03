CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_id" text,
	"entity_type" text,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "asset_progress_unique" UNIQUE("user_id","asset_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"access_expires_at" timestamp with time zone,
	"transferred_to_cohort_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_members_unique" UNIQUE("cohort_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_suggested_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_suggested_assets_unique" UNIQUE("cohort_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_transfer_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"from_cohort_id" text NOT NULL,
	"to_cohort_id" text NOT NULL,
	"initiated_by" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"instructor_id" text NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"schedule_text" text,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"meeting_url" text,
	"community_url" text,
	"sessions_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"price_paise" integer,
	"completed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_students" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_collaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'co_instructor' NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_collab_unique" UNIQUE("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "guest_purchase_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"asset_id" text NOT NULL,
	"cohort_id" text,
	"coupon_code" text,
	"status" text DEFAULT 'otp_pending' NOT NULL,
	"otp_hash" text,
	"otp_expires_at" timestamp with time zone,
	"cashfree_order_id" text,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_login_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_login_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "mentoring_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"date" text NOT NULL,
	"window_start" text NOT NULL,
	"window_end" text NOT NULL,
	"allowed_durations" integer[] NOT NULL,
	"meeting_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"cancelled_by" text,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_duration_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"duration_mins" integer NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "m_prices_instructor_duration_uq" UNIQUE("instructor_id","duration_mins")
);
--> statement-breakpoint
CREATE TABLE "mentoring_testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"booking_id" text,
	"student_id" text,
	"reviewer_name" text NOT NULL,
	"reviewer_role" text,
	"reviewer_avatar" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"body" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"rejected_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"instructor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"payment_method" text DEFAULT 'free' NOT NULL,
	"amount_paid_paise" integer DEFAULT 0 NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"order_id" text,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attended_at" timestamp with time zone,
	"cancellation_reason" text,
	CONSTRAINT "event_attendees_event_user_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "event_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"url_or_key" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"is_pre_event" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"short_description" text,
	"host_id" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"start_at" timestamp with time zone DEFAULT now() NOT NULL,
	"end_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registration_deadline" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text DEFAULT 'public' NOT NULL,
	"event_type" text DEFAULT 'free' NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"price_credits" integer,
	"max_attendees" integer,
	"status" text DEFAULT 'published' NOT NULL,
	"venue_type" text DEFAULT 'online' NOT NULL,
	"venue_details" jsonb DEFAULT '{}'::jsonb,
	"link" text,
	"cover_image_url" text,
	"is_resources_released" boolean DEFAULT false NOT NULL,
	"whatsapp_group_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_event_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone" text NOT NULL,
	"organization" text NOT NULL,
	"job_title" text NOT NULL,
	"experience_level" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"linkedin_url" text,
	"github_url" text,
	"dietary_preference" text,
	"emergency_contact" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_event_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "credit_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"price_paise" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"description" text NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enable_catalog" boolean DEFAULT true NOT NULL,
	"enable_mentoring" boolean DEFAULT true NOT NULL,
	"enable_certifications" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentoring_slots" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "mentoring_slots" CASCADE;--> statement-breakpoint
ALTER TABLE "asset_ownership" DROP CONSTRAINT "asset_ownership_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "commerce_coupons" DROP CONSTRAINT "commerce_coupons_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "commerce_orders" DROP CONSTRAINT "commerce_orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "mentoring_bookings" DROP CONSTRAINT "mentoring_bookings_slot_id_mentoring_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "mentoring_bookings" DROP CONSTRAINT "mentoring_bookings_student_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "bookings_student_idx";--> statement-breakpoint
DROP INDEX "bookings_slot_idx";--> statement-breakpoint
ALTER TABLE "commerce_orders" ALTER COLUMN "asset_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ALTER COLUMN "status" SET DEFAULT 'pending_payment';--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "login_preference" text DEFAULT 'otp' NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_price_bounds" jsonb;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_handle" text;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_headline" text;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_about" text;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_years_exp" integer;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_languages" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_credentials" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_video_intro_url" text;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_social_links" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD COLUMN "mentoring_is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "delivery_format" text DEFAULT 'self_paced' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_self_paced_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_live_batches_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "currency" text DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD COLUMN "order_type" text DEFAULT 'asset' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD COLUMN "target_id" text;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "availability_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "instructor_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "starts_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "ends_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "duration_mins" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "price_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "coupon_id" text;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "discount_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "reminder_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD COLUMN "cancelled_by_role" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_progress" ADD CONSTRAINT "asset_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_progress" ADD CONSTRAINT "asset_progress_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_transferred_to_cohort_id_cohorts_id_fk" FOREIGN KEY ("transferred_to_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_suggested_assets" ADD CONSTRAINT "cohort_suggested_assets_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_suggested_assets" ADD CONSTRAINT "cohort_suggested_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_transfer_requests" ADD CONSTRAINT "cohort_transfer_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_transfer_requests" ADD CONSTRAINT "cohort_transfer_requests_from_cohort_id_cohorts_id_fk" FOREIGN KEY ("from_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_transfer_requests" ADD CONSTRAINT "cohort_transfer_requests_to_cohort_id_cohorts_id_fk" FOREIGN KEY ("to_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_transfer_requests" ADD CONSTRAINT "cohort_transfer_requests_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_course_id_assets_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_collaborators" ADD CONSTRAINT "course_collaborators_course_id_assets_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_collaborators" ADD CONSTRAINT "course_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_collaborators" ADD CONSTRAINT "course_collaborators_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_purchase_intents" ADD CONSTRAINT "guest_purchase_intents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_purchase_intents" ADD CONSTRAINT "guest_purchase_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_login_tokens" ADD CONSTRAINT "magic_login_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_availability" ADD CONSTRAINT "mentoring_availability_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_availability" ADD CONSTRAINT "mentoring_availability_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_duration_prices" ADD CONSTRAINT "mentoring_duration_prices_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_testimonials" ADD CONSTRAINT "mentoring_testimonials_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_testimonials" ADD CONSTRAINT "mentoring_testimonials_booking_id_mentoring_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."mentoring_bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_testimonials" ADD CONSTRAINT "mentoring_testimonials_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_resources" ADD CONSTRAINT "event_resources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_event_profiles" ADD CONSTRAINT "user_event_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_progress_user_idx" ON "asset_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "asset_progress_asset_idx" ON "asset_progress" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "cohort_members_cohort_idx" ON "cohort_memberships" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "cohort_members_user_idx" ON "cohort_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cohort_suggested_assets_cohort_idx" ON "cohort_suggested_assets" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "transfer_req_student_idx" ON "cohort_transfer_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "transfer_req_status_idx" ON "cohort_transfer_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cohorts_course_idx" ON "cohorts" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cohorts_instructor_idx" ON "cohorts" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "course_collab_course_idx" ON "course_collaborators" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_collab_user_idx" ON "course_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gpi_email_idx" ON "guest_purchase_intents" USING btree ("email");--> statement-breakpoint
CREATE INDEX "gpi_status_idx" ON "guest_purchase_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mlt_token_idx" ON "magic_login_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "mlt_user_idx" ON "magic_login_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "m_avail_instructor_idx" ON "mentoring_availability" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "m_avail_date_idx" ON "mentoring_availability" USING btree ("date");--> statement-breakpoint
CREATE INDEX "m_avail_status_date_idx" ON "mentoring_availability" USING btree ("status","date");--> statement-breakpoint
CREATE INDEX "m_prices_instructor_idx" ON "mentoring_duration_prices" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "m_testimonials_instructor_idx" ON "mentoring_testimonials" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "m_testimonials_published_idx" ON "mentoring_testimonials" USING btree ("is_published","instructor_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_attendees_event_status_idx" ON "event_attendees" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_resources_event_sort_idx" ON "event_resources" USING btree ("event_id","sort_order");--> statement-breakpoint
CREATE INDEX "events_status_start_idx" ON "events" USING btree ("status","start_at");--> statement-breakpoint
CREATE INDEX "events_host_idx" ON "events" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "user_event_profiles_user_idx" ON "user_event_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_packages_active_sort_idx" ON "credit_packages" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "credit_tx_user_created_idx" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_tx_ref_idx" ON "credit_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "user_credits_user_idx" ON "user_credits" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "asset_ownership" ADD CONSTRAINT "asset_ownership_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_availability_id_mentoring_availability_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."mentoring_availability"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_coupon_id_commerce_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."commerce_coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ip_handle_idx" ON "identity_profiles" USING btree ("mentoring_handle");--> statement-breakpoint
CREATE INDEX "ip_mentoring_enabled_idx" ON "identity_profiles" USING btree ("mentoring_enabled");--> statement-breakpoint
CREATE INDEX "assets_visibility_idx" ON "assets" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "assets_deleted_idx" ON "assets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "orders_type_target_idx" ON "commerce_orders" USING btree ("order_type","target_id");--> statement-breakpoint
CREATE INDEX "m_bookings_student_idx" ON "mentoring_bookings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "m_bookings_instructor_idx" ON "mentoring_bookings" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "m_bookings_avail_idx" ON "mentoring_bookings" USING btree ("availability_id");--> statement-breakpoint
CREATE INDEX "m_bookings_status_starts_idx" ON "mentoring_bookings" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "m_bookings_reminder_idx" ON "mentoring_bookings" USING btree ("reminder_sent","starts_at");--> statement-breakpoint
ALTER TABLE "mentoring_bookings" DROP COLUMN "slot_id";--> statement-breakpoint
ALTER TABLE "mentoring_bookings" DROP COLUMN "confirmed_at";--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD CONSTRAINT "identity_profiles_mentoring_handle_unique" UNIQUE("mentoring_handle");--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "m_bookings_avail_start_uq" UNIQUE("availability_id","starts_at");
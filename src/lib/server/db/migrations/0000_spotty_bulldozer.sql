CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authz_capabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authz_capabilities_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "authz_role_capabilities" (
	"role_id" text NOT NULL,
	"capability_id" text NOT NULL,
	CONSTRAINT "authz_role_capabilities_role_id_capability_id_pk" PRIMARY KEY("role_id","capability_id")
);
--> statement-breakpoint
CREATE TABLE "authz_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authz_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "authz_user_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"capability_id" text NOT NULL,
	"effect" text NOT NULL,
	"reason" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authz_user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authz_user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "storage_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"storage_provider" text NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"checksum" text,
	"uploaded_by" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_objects_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "asset_content" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" text NOT NULL,
	"content_type" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_ownership" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"source" text NOT NULL,
	"order_id" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "asset_ownership_unique" UNIQUE("owner_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"owner_id" text NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "assets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commerce_coupon_uses" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"min_amount_paise" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"asset_id" text,
	"created_by" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "commerce_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"number" text NOT NULL,
	"pdf_url" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "commerce_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"cashfree_order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"coupon_id" text,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_orders_cashfree_order_id_unique" UNIQUE("cashfree_order_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_attempt_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option_id" text,
	"text_answer" text,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"score" integer,
	"max_score" integer,
	"passed" boolean,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"evaluated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assessment_options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"content" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"type" text DEFAULT 'mcq' NOT NULL,
	"content" text NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"passing_percent" integer DEFAULT 70 NOT NULL,
	"time_limit_mins" integer,
	"max_attempts" integer,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"shuffle_options" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_tests_asset_id_unique" UNIQUE("asset_id")
);
--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"html_content" text NOT NULL,
	"thumbnail" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"pdf_url" text,
	"qr_code_url" text,
	"verify_url" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"student_id" text NOT NULL,
	"order_id" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"meeting_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_profiles" ADD CONSTRAINT "identity_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_role_capabilities" ADD CONSTRAINT "authz_role_capabilities_role_id_authz_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."authz_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_role_capabilities" ADD CONSTRAINT "authz_role_capabilities_capability_id_authz_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "public"."authz_capabilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_user_overrides" ADD CONSTRAINT "authz_user_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_user_overrides" ADD CONSTRAINT "authz_user_overrides_capability_id_authz_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "public"."authz_capabilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_user_roles" ADD CONSTRAINT "authz_user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_user_roles" ADD CONSTRAINT "authz_user_roles_role_id_authz_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."authz_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authz_user_roles" ADD CONSTRAINT "authz_user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_content" ADD CONSTRAINT "asset_content_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_content" ADD CONSTRAINT "asset_content_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_ownership" ADD CONSTRAINT "asset_ownership_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_ownership" ADD CONSTRAINT "asset_ownership_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_coupon_uses" ADD CONSTRAINT "commerce_coupon_uses_coupon_id_commerce_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."commerce_coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_coupon_uses" ADD CONSTRAINT "commerce_coupon_uses_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_coupon_uses" ADD CONSTRAINT "commerce_coupon_uses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_coupons" ADD CONSTRAINT "commerce_coupons_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_coupons" ADD CONSTRAINT "commerce_coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_invoices" ADD CONSTRAINT "commerce_invoices_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempt_answers" ADD CONSTRAINT "assessment_attempt_answers_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempt_answers" ADD CONSTRAINT "assessment_attempt_answers_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempt_answers" ADD CONSTRAINT "assessment_attempt_answers_selected_option_id_assessment_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."assessment_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_test_id_assessment_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."assessment_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_options" ADD CONSTRAINT "assessment_options_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_test_id_assessment_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."assessment_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_tests" ADD CONSTRAINT "assessment_tests_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_certificate_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_test_id_assessment_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."assessment_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_slot_id_mentoring_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."mentoring_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_bookings" ADD CONSTRAINT "mentoring_bookings_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_slots" ADD CONSTRAINT "mentoring_slots_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_slots" ADD CONSTRAINT "mentoring_slots_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "storage_objects_provider_idx" ON "storage_objects" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "storage_objects_uploader_idx" ON "storage_objects" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "asset_content_asset_idx" ON "asset_content" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_content_current_idx" ON "asset_content" USING btree ("asset_id","is_current");--> statement-breakpoint
CREATE INDEX "asset_ownership_owner_idx" ON "asset_ownership" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "asset_ownership_asset_idx" ON "asset_ownership" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "assets_owner_idx" ON "assets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coupon_uses_coupon_idx" ON "commerce_coupon_uses" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_uses_user_idx" ON "commerce_coupon_uses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "commerce_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_asset_idx" ON "commerce_orders" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "commerce_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "answers_attempt_idx" ON "assessment_attempt_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "attempts_user_idx" ON "assessment_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attempts_test_idx" ON "assessment_attempts" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "attempts_status_idx" ON "assessment_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "options_question_idx" ON "assessment_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_test_idx" ON "assessment_questions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "certificates_user_idx" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "certificates_test_idx" ON "certificates" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "bookings_student_idx" ON "mentoring_bookings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "bookings_slot_idx" ON "mentoring_bookings" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "slots_instructor_idx" ON "mentoring_slots" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "slots_status_idx" ON "mentoring_slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slots_starts_idx" ON "mentoring_slots" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_entity_idx" ON "analytics_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "analytics_user_idx" ON "analytics_events" USING btree ("user_id");
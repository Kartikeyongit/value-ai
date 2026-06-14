-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('FREE', 'STARTUP', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ProviderCategory" AS ENUM ('LLM', 'IMAGE', 'AUDIO', 'EMBEDDING', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "CredType" AS ENUM ('API_KEY', 'OAUTH_TOKEN', 'AWS_ROLE', 'AZURE_SERVICE_PRINCIPAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'NEVER');

-- CreateEnum
CREATE TYPE "ModelCategory" AS ENUM ('CHAT', 'COMPLETION', 'EMBEDDING', 'IMAGE_GENERATION', 'IMAGE_EDITING', 'AUDIO_TRANSCRIPTION', 'AUDIO_GENERATION', 'MODERATION', 'FINE_TUNING');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PAY_AS_YOU_GO', 'PRO', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecCategory" AS ENUM ('PLAN_OPTIMIZATION', 'MODEL_DOWNGRADE', 'PROVIDER_SWITCH', 'VOLUME_DISCOUNT', 'REGION_OPTIMIZATION', 'UNUSED_RESOURCE', 'DUPLICATE_USAGE', 'CAPACITY_RIGHTSIZING');

-- CreateEnum
CREATE TYPE "RecSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "RecStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BUDGET_THRESHOLD', 'ANOMALY_DETECTION', 'SPIKE_DETECTION', 'FORECAST_EXCEEDED', 'NEW_RECOMMENDATION', 'UNUSED_RESOURCE', 'COST_INCREASE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "OrgPlan" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "team_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProviderCategory" NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "docs_url" TEXT,
    "oauth_enabled" BOOLEAN NOT NULL DEFAULT false,
    "oauth_scopes" TEXT[],
    "regions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "credential_type" "CredType" NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "key_last_four" TEXT,
    "scope" TEXT,
    "region" TEXT DEFAULT 'us-east-1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_status" "SyncStatus",
    "sync_error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_models" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "category" "ModelCategory" NOT NULL,
    "input_price" DECIMAL(10,6) NOT NULL,
    "output_price" DECIMAL(10,6) NOT NULL,
    "image_price" DECIMAL(10,6),
    "audio_price" DECIMAL(10,6),
    "context_price" DECIMAL(10,6),
    "region" TEXT NOT NULL DEFAULT 'global',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_unit" TEXT NOT NULL DEFAULT 'per_1m_tokens',
    "plan_tier" "PlanTier" NOT NULL DEFAULT 'PAY_AS_YOU_GO',
    "enterprise_rate" DECIMAL(10,6),
    "volume_discount" JSONB,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "source_url" TEXT,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "credential_id" TEXT,
    "project_id" TEXT,
    "model_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "tokens_in" INTEGER NOT NULL,
    "tokens_out" INTEGER NOT NULL,
    "tokens_total" INTEGER NOT NULL,
    "cost_input" DECIMAL(12,6) NOT NULL,
    "cost_output" DECIMAL(12,6) NOT NULL,
    "cost_total" DECIMAL(12,6) NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "status_code" INTEGER NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "request_type" TEXT,
    "endpoint" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "category" "RecCategory" NOT NULL,
    "severity" "RecSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "current_monthly_cost" DECIMAL(12,2) NOT NULL,
    "recommended_monthly_cost" DECIMAL(12,2) NOT NULL,
    "monthly_savings" DECIMAL(12,2) NOT NULL,
    "savings_percent" DECIMAL(5,2) NOT NULL,
    "annual_savings" DECIMAL(12,2) NOT NULL,
    "current_plan" TEXT,
    "recommended_plan" TEXT,
    "current_provider" TEXT,
    "recommended_provider" TEXT,
    "current_model" TEXT,
    "recommended_model" TEXT,
    "evidence" JSONB[],
    "confidence_score" DECIMAL(3,2) NOT NULL,
    "status" "RecStatus" NOT NULL DEFAULT 'ACTIVE',
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by" TEXT,
    "applied_at" TIMESTAMP(3),
    "applied_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "alert_type" "AlertType" NOT NULL,
    "threshold_value" DECIMAL(12,2) NOT NULL,
    "threshold_unit" TEXT NOT NULL,
    "comparison" TEXT NOT NULL DEFAULT 'gt',
    "provider_id" TEXT,
    "model_id" TEXT,
    "project_id" TEXT,
    "team_id" TEXT,
    "channels" TEXT[],
    "webhook_url" TEXT,
    "email_recipients" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(12,2) NOT NULL,
    "message" TEXT NOT NULL,
    "sent_to" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "provider_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'projected',
    "breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "projected_cost" DECIMAL(12,2) NOT NULL,
    "lower_bound" DECIMAL(12,2) NOT NULL,
    "upper_bound" DECIMAL(12,2) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "provider_breakdown" JSONB NOT NULL,
    "model_breakdown" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_detections" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "detection_type" TEXT NOT NULL,
    "severity" "RecSeverity" NOT NULL,
    "provider_id" TEXT,
    "model_id" TEXT,
    "credential_id" TEXT,
    "team_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB[],
    "estimated_waste" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "waste_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "records_processed" INTEGER NOT NULL,
    "records_inserted" INTEGER NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "usage_logs_org_id_timestamp_idx" ON "usage_logs"("org_id", "timestamp");

-- CreateIndex
CREATE INDEX "usage_logs_provider_id_timestamp_idx" ON "usage_logs"("provider_id", "timestamp");

-- CreateIndex
CREATE INDEX "usage_logs_model_id_timestamp_idx" ON "usage_logs"("model_id", "timestamp");

-- CreateIndex
CREATE INDEX "usage_logs_project_id_timestamp_idx" ON "usage_logs"("project_id", "timestamp");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_models" ADD CONSTRAINT "pricing_models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "provider_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

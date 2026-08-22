-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "client_id" TEXT;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "client_id" TEXT;

-- AlterTable
ALTER TABLE "brand_profile" ADD COLUMN     "allow_customer_result_claims" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "client_id" TEXT,
ADD COLUMN     "tone_questionnaire" JSONB,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "brand_directives" ADD COLUMN     "client_id" TEXT;

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "client_id" TEXT;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "client_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_channels" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "channel_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "credential_ref" TEXT,
    "external_id" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tone_examples" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tone_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_sub_id" TEXT,
    "plan_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "event_type" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_client_id_idx" ON "users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_channels_client_id_channel_key_key" ON "client_channels"("client_id", "channel_key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_client_id_key" ON "subscriptions"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_key" ON "subscriptions"("stripe_sub_id");

-- CreateIndex
CREATE INDEX "usage_events_client_id_created_at_idx" ON "usage_events"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "ideas_client_id_idx" ON "ideas"("client_id");

-- CreateIndex
CREATE INDEX "assets_client_id_idx" ON "assets"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profile_client_id_key" ON "brand_profile"("client_id");

-- CreateIndex
CREATE INDEX "brand_directives_client_id_idx" ON "brand_directives"("client_id");

-- CreateIndex
CREATE INDEX "blogs_client_id_idx" ON "blogs"("client_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_channels" ADD CONSTRAINT "client_channels_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tone_examples" ADD CONSTRAINT "tone_examples_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profile" ADD CONSTRAINT "brand_profile_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_directives" ADD CONSTRAINT "brand_directives_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

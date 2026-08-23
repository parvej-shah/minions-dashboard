CREATE TABLE IF NOT EXISTS "pipeline_runs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pipeline_runs_client_id_idx" ON "pipeline_runs"("client_id");

ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE relationship_type AS ENUM ('supplier', 'customer', 'competitor');

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  ticker TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS relationships (
  id BIGSERIAL PRIMARY KEY,
  source_company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  target_company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type relationship_type NOT NULL,
  weight DOUBLE PRECISION,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships (source_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships (target_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships (type);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id     VARCHAR(255) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

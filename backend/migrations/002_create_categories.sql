-- Categories are NOT hard-coupled to a type.
-- type is optional and only serves as a default hint.
-- When creating a transaction the user picks the type (income/expense) independently.

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  default_type VARCHAR(10) CHECK (default_type IN ('income', 'expense', 'other')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Seed a few default categories for every new user (called from app logic, not here)

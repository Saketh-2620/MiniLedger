CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description   TEXT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type    ON transactions(type);

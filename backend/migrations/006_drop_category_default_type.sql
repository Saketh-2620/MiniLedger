-- Remove default_type from categories — type is now set per transaction, not per category.
ALTER TABLE categories DROP COLUMN IF EXISTS default_type;

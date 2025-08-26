/*
  # Add list_pricing column to scenarios table

  1. Changes
    - Add `list_pricing` column to `scenarios` table
    - Column type: JSONB with default empty array
    - Allow existing scenarios to have the new column with default value

  2. Security
    - No changes to RLS policies needed as column is part of existing table
*/

-- Add list_pricing column to scenarios table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'list_pricing'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN list_pricing JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
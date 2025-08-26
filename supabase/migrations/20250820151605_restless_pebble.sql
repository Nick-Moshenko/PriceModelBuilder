/*
  # Add Bedrooms and Bathrooms to Units Table

  1. Schema Changes
    - Add `bedrooms` column to `units` table (integer, not null)
    - Add `bathrooms` column to `units` table (numeric(2,1), not null)

  2. Data Updates
    - Update existing units with bedroom and bathroom counts based on plan types
    - 1B = 1 bedroom, 1 bathroom
    - 1B+D = 1 bedroom + den, 1 bathroom  
    - 2B = 2 bedrooms, 2 bathrooms
    - 2B+D = 2 bedrooms + den, 2 bathrooms
    - 3B = 3 bedrooms, 2.5 bathrooms

  3. Security
    - No RLS changes needed (inherits from existing table policies)
*/

-- Add bedrooms and bathrooms columns to units table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'bedrooms'
  ) THEN
    ALTER TABLE units ADD COLUMN bedrooms integer NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'bathrooms'
  ) THEN
    ALTER TABLE units ADD COLUMN bathrooms numeric(2,1) NOT NULL DEFAULT 1.0;
  END IF;
END $$;

-- Update existing units with bedroom and bathroom counts based on plan types
UPDATE units SET 
  bedrooms = CASE 
    WHEN plan_type = '1B' THEN 1
    WHEN plan_type = '1B+D' THEN 1
    WHEN plan_type = '2B' THEN 2
    WHEN plan_type = '2B+D' THEN 2
    WHEN plan_type = '3B' THEN 3
    ELSE 1
  END,
  bathrooms = CASE 
    WHEN plan_type = '1B' THEN 1.0
    WHEN plan_type = '1B+D' THEN 1.0
    WHEN plan_type = '2B' THEN 2.0
    WHEN plan_type = '2B+D' THEN 2.0
    WHEN plan_type = '3B' THEN 2.5
    ELSE 1.0
  END
WHERE bedrooms = 1 AND bathrooms = 1.0; -- Only update if still at default values
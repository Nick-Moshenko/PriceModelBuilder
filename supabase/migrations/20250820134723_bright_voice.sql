/*
  # Update RLS policies for public access

  1. Security Changes
    - Update all RLS policies to allow public access
    - Remove authentication requirements for demo purposes
    - Maintain data integrity while allowing unrestricted access

  2. Tables Updated
    - projects: Allow public read/write access
    - units: Allow public read/write access  
    - scenarios: Allow public read/write/delete access
    - rules: Allow public read/write/delete access
    - unit_prices: Allow public read/write/delete access

  Note: This is for demo purposes. In production, proper authentication should be implemented.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read all projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;

DROP POLICY IF EXISTS "Users can create units" ON units;
DROP POLICY IF EXISTS "Users can read all units" ON units;
DROP POLICY IF EXISTS "Users can update units" ON units;

DROP POLICY IF EXISTS "Users can create scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can read all scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete scenarios" ON scenarios;

DROP POLICY IF EXISTS "Users can create rules" ON rules;
DROP POLICY IF EXISTS "Users can read all rules" ON rules;
DROP POLICY IF EXISTS "Users can update rules" ON rules;
DROP POLICY IF EXISTS "Users can delete rules" ON rules;

DROP POLICY IF EXISTS "Users can create unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Users can read all unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Users can update unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Users can delete unit prices" ON unit_prices;

-- Create new public access policies
CREATE POLICY "Public can read projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create projects"
  ON projects
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update projects"
  ON projects
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read units"
  ON units
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create units"
  ON units
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update units"
  ON units
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read scenarios"
  ON scenarios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create scenarios"
  ON scenarios
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update scenarios"
  ON scenarios
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete scenarios"
  ON scenarios
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can read rules"
  ON rules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create rules"
  ON rules
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update rules"
  ON rules
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete rules"
  ON rules
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can read unit prices"
  ON unit_prices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create unit prices"
  ON unit_prices
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update unit prices"
  ON unit_prices
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete unit prices"
  ON unit_prices
  FOR DELETE
  TO public
  USING (true);
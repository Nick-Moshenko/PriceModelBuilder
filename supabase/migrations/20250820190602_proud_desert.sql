/*
  # Add User-Specific Projects

  1. New Tables
    - Update projects table to include user_id
    - Add project selection and creation functionality
  
  2. Security
    - Enable RLS on all tables with user-based policies
    - Ensure users can only access their own projects
  
  3. Changes
    - Add user_id to projects table
    - Update all foreign key relationships
    - Add user-based RLS policies
*/

-- Add user_id to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for projects
DROP POLICY IF EXISTS "Public can create projects" ON projects;
DROP POLICY IF EXISTS "Public can read projects" ON projects;
DROP POLICY IF EXISTS "Public can update projects" ON projects;

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for units
DROP POLICY IF EXISTS "Public can create units" ON units;
DROP POLICY IF EXISTS "Public can read units" ON units;
DROP POLICY IF EXISTS "Public can update units" ON units;

CREATE POLICY "Users can create units in own projects"
  ON units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = units.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read units in own projects"
  ON units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = units.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update units in own projects"
  ON units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = units.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = units.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update RLS policies for scenarios
DROP POLICY IF EXISTS "Public can create scenarios" ON scenarios;
DROP POLICY IF EXISTS "Public can read scenarios" ON scenarios;
DROP POLICY IF EXISTS "Public can update scenarios" ON scenarios;
DROP POLICY IF EXISTS "Public can delete scenarios" ON scenarios;

CREATE POLICY "Users can create scenarios in own projects"
  ON scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenarios.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read scenarios in own projects"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenarios.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scenarios in own projects"
  ON scenarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenarios.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenarios.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scenarios in own projects"
  ON scenarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenarios.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update RLS policies for rules
DROP POLICY IF EXISTS "Public can create rules" ON rules;
DROP POLICY IF EXISTS "Public can read rules" ON rules;
DROP POLICY IF EXISTS "Public can update rules" ON rules;
DROP POLICY IF EXISTS "Public can delete rules" ON rules;

CREATE POLICY "Users can create rules in own projects"
  ON rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = rules.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read rules in own projects"
  ON rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = rules.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rules in own projects"
  ON rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = rules.scenario_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = rules.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rules in own projects"
  ON rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = rules.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update RLS policies for unit_prices
DROP POLICY IF EXISTS "Public can create unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Public can read unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Public can update unit prices" ON unit_prices;
DROP POLICY IF EXISTS "Public can delete unit prices" ON unit_prices;

CREATE POLICY "Users can create unit prices in own projects"
  ON unit_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = unit_prices.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read unit prices in own projects"
  ON unit_prices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = unit_prices.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update unit prices in own projects"
  ON unit_prices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = unit_prices.scenario_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = unit_prices.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete unit prices in own projects"
  ON unit_prices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      JOIN projects ON scenarios.project_id = projects.id
      WHERE scenarios.id = unit_prices.scenario_id 
      AND projects.user_id = auth.uid()
    )
  );
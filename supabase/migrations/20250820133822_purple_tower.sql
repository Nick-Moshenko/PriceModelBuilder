/*
  # Price Model Builder Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `units`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `floor` (text)
      - `unit_number` (text)
      - `plan_type` (text)
      - `sqft` (integer)
      - `base_price_per_sqft` (decimal)
      - `orientation` (text)
      - `outdoor_sqft` (integer)
      - `base_price` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `scenarios`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text)
      - `version` (text)
      - `created_by` (text)
      - `is_baseline` (boolean)
      - `global_settings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `rules`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `name` (text)
      - `enabled` (boolean)
      - `order_index` (integer)
      - `criteria` (jsonb)
      - `adjustment` (jsonb)
      - `created_at` (timestamp)
    
    - `unit_prices`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `unit_id` (uuid, foreign key)
      - `final_price` (decimal)
      - `final_price_per_sqft` (decimal)
      - `premiums` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  floor text NOT NULL,
  unit_number text NOT NULL,
  plan_type text NOT NULL,
  sqft integer NOT NULL,
  base_price_per_sqft decimal(10,2) NOT NULL,
  orientation text NOT NULL,
  outdoor_sqft integer DEFAULT 0,
  base_price decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text DEFAULT '1.0',
  created_by text NOT NULL,
  is_baseline boolean DEFAULT false,
  global_settings jsonb DEFAULT '{"minPricePerSqft": 1100, "maxPricePerSqft": 1900, "roundingRule": 1000}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  order_index integer DEFAULT 0,
  criteria jsonb DEFAULT '{}',
  adjustment jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create unit_prices table
CREATE TABLE IF NOT EXISTS unit_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  final_price decimal(12,2) NOT NULL,
  final_price_per_sqft decimal(10,2) NOT NULL,
  premiums jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(scenario_id, unit_id)
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all units"
  ON units
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create units"
  ON units
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update units"
  ON units
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all scenarios"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create scenarios"
  ON scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update scenarios"
  ON scenarios
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete scenarios"
  ON scenarios
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all rules"
  ON rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rules"
  ON rules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update rules"
  ON rules
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete rules"
  ON rules
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all unit prices"
  ON unit_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create unit prices"
  ON unit_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update unit prices"
  ON unit_prices
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete unit prices"
  ON unit_prices
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_rules_scenario_id ON rules(scenario_id);
CREATE INDEX IF NOT EXISTS idx_unit_prices_scenario_id ON unit_prices(scenario_id);
CREATE INDEX IF NOT EXISTS idx_unit_prices_unit_id ON unit_prices(unit_id);
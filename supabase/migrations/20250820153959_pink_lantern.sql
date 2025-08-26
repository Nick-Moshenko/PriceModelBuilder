/*
  # Add scenario locking functionality

  1. New Column
    - `is_locked` (boolean) - indicates if scenario is locked from editing
  
  2. Updates
    - Set baseline scenarios to locked by default
    - Add default value for new scenarios (unlocked)
*/

-- Add is_locked column to scenarios table
ALTER TABLE scenarios ADD COLUMN is_locked boolean DEFAULT false;

-- Lock all existing baseline scenarios
UPDATE scenarios SET is_locked = true WHERE is_baseline = true;

-- Add comment for documentation
COMMENT ON COLUMN scenarios.is_locked IS 'Indicates if the scenario is locked from editing';
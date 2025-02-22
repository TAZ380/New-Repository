/*
  # Add location field to nurse_shifts table

  1. Changes
    - Add location field to nurse_shifts table
    - Make location field required
    - Add Spanish translation
*/

-- Add location field to nurse_shifts
ALTER TABLE nurse_shifts
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE nurse_shifts
  ALTER COLUMN location DROP DEFAULT;

-- Add Spanish translation
COMMENT ON COLUMN nurse_shifts.location IS 'Ubicación del turno';
/*
  # Add nurse profile completion status

  1. Changes
    - Add completion_status to nurse_profiles table
    - Add completion_percentage to nurse_profiles table
    - Add last_profile_update to nurse_profiles table
*/

ALTER TABLE nurse_profiles
  ADD COLUMN IF NOT EXISTS completion_status text DEFAULT 'incomplete'
  CHECK (completion_status IN ('incomplete', 'complete')),
  ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  ADD COLUMN IF NOT EXISTS last_profile_update timestamptz DEFAULT now();

-- Add Spanish translations
COMMENT ON COLUMN nurse_profiles.completion_status IS 'Estado de completitud del perfil';
COMMENT ON COLUMN nurse_profiles.completion_percentage IS 'Porcentaje de completitud del perfil';
COMMENT ON COLUMN nurse_profiles.last_profile_update IS 'Última actualización del perfil';

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_nurse_profile_completion()
RETURNS trigger AS $$
DECLARE
  total_fields integer := 6; -- Total number of important fields
  completed_fields integer := 0;
BEGIN
  -- Check each important field
  IF NEW.license_number IS NOT NULL AND NEW.license_number != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.specialties IS NOT NULL AND array_length(NEW.specialties, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience >= 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.education IS NOT NULL AND NEW.education != '[]' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.certifications IS NOT NULL AND array_length(NEW.certifications, 1) > 0 THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NEW.availability IS NOT NULL AND NEW.availability != '{}' THEN
    completed_fields := completed_fields + 1;
  END IF;

  -- Calculate percentage
  NEW.completion_percentage := (completed_fields::float / total_fields::float * 100)::integer;
  
  -- Update completion status
  IF NEW.completion_percentage = 100 THEN
    NEW.completion_status := 'complete';
  ELSE
    NEW.completion_status := 'incomplete';
  END IF;

  -- Update last_profile_update
  NEW.last_profile_update := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completion calculation
DROP TRIGGER IF EXISTS calculate_nurse_profile_completion_trigger ON nurse_profiles;
CREATE TRIGGER calculate_nurse_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON nurse_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_nurse_profile_completion();
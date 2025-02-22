/*
  # Add Superuser Role and Permissions

  1. Changes
    - Add 'superuser' to user_role enum
    - Create superuser policies for all tables

  2. Security
    - Superusers can view and manage all data
    - Maintain existing RLS for other roles
*/

-- First, add the new enum value in a separate transaction
BEGIN;
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superuser';
COMMIT;

-- Now create the policies
CREATE POLICY "Superusers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can view all nurse profiles"
  ON nurse_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can update all nurse profiles"
  ON nurse_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can manage all job offers"
  ON job_offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can manage all applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can manage all ratings"
  ON job_ratings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );
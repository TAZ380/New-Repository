/*
  # Fix Database Policies

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create new simplified policies with no recursion
    - Ensure proper access control for all tables
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow profile self access" ON profiles;
DROP POLICY IF EXISTS "Allow public profile read" ON profiles;
DROP POLICY IF EXISTS "Allow nurse self management" ON nurse_profiles;
DROP POLICY IF EXISTS "Allow nurse profile read" ON nurse_profiles;
DROP POLICY IF EXISTS "Allow company job management" ON job_offers;
DROP POLICY IF EXISTS "Allow job offer read" ON job_offers;
DROP POLICY IF EXISTS "Allow nurse application management" ON job_applications;
DROP POLICY IF EXISTS "Allow company application view" ON job_applications;
DROP POLICY IF EXISTS "Allow company rating management" ON job_ratings;
DROP POLICY IF EXISTS "Allow rating read" ON job_ratings;

-- Create new simplified policies for profiles
CREATE POLICY "profiles_self_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_public_read"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for nurse_profiles
CREATE POLICY "nurse_profiles_self_access"
  ON nurse_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "nurse_profiles_public_read"
  ON nurse_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for job_offers
CREATE POLICY "job_offers_company_access"
  ON job_offers
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "job_offers_public_read"
  ON job_offers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for job_applications
CREATE POLICY "job_applications_nurse_access"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (nurse_id = auth.uid());

CREATE POLICY "job_applications_company_read"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_applications.job_id
      AND job_offers.company_id = auth.uid()
    )
  );

-- Policies for job_ratings
CREATE POLICY "job_ratings_company_insert"
  ON job_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_id
      AND job_offers.company_id = auth.uid()
      AND job_offers.status = 'filled'
    )
  );

CREATE POLICY "job_ratings_public_read"
  ON job_ratings
  FOR SELECT
  TO authenticated
  USING (true);
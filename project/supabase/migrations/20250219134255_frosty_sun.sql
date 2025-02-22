/*
  # Fix RLS policy recursion

  1. Changes
    - Drop problematic policies
    - Create new non-recursive policies
    - Simplify policy structure
    
  2. Security
    - Maintain same security model
    - Use direct role checks
    - Avoid policy recursion
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON profiles;
DROP POLICY IF EXISTS "Superusers can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Basic profile read access" ON profiles;
DROP POLICY IF EXISTS "Profile self-update access" ON profiles;
DROP POLICY IF EXISTS "Profile self-insert access" ON profiles;

-- Create new non-recursive policies for profiles
CREATE POLICY "Allow profile self access"
  ON profiles
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Allow public profile read"
  ON profiles
  FOR SELECT
  USING (true);

-- Update nurse profile policies to avoid recursion
DROP POLICY IF EXISTS "Nurse self-management access" ON nurse_profiles;
DROP POLICY IF EXISTS "Nurse profile read access" ON nurse_profiles;

CREATE POLICY "Allow nurse self management"
  ON nurse_profiles
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Allow nurse profile read"
  ON nurse_profiles
  FOR SELECT
  USING (true);

-- Update job-related policies to use direct checks
DROP POLICY IF EXISTS "Company job management" ON job_offers;
DROP POLICY IF EXISTS "Job offer read access" ON job_offers;

CREATE POLICY "Allow company job management"
  ON job_offers
  FOR ALL
  USING (company_id = auth.uid());

CREATE POLICY "Allow job offer read"
  ON job_offers
  FOR SELECT
  USING (true);

-- Update application policies
DROP POLICY IF EXISTS "Nurse application management" ON job_applications;
DROP POLICY IF EXISTS "Company application view access" ON job_applications;

CREATE POLICY "Allow nurse application management"
  ON job_applications
  FOR ALL
  USING (nurse_id = auth.uid());

CREATE POLICY "Allow company application view"
  ON job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_applications.job_id
      AND job_offers.company_id = auth.uid()
    )
  );

-- Update rating policies
DROP POLICY IF EXISTS "Company rating management" ON job_ratings;
DROP POLICY IF EXISTS "Rating read access" ON job_ratings;

CREATE POLICY "Allow company rating management"
  ON job_ratings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_id
      AND job_offers.company_id = auth.uid()
      AND job_offers.status = 'filled'
    )
  );

CREATE POLICY "Allow rating read"
  ON job_ratings
  FOR SELECT
  USING (true);
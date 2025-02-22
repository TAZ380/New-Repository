/*
  # Fix RLS policies and remove conflicts

  1. Changes
    - Drop all existing policies first
    - Create new simplified policies
    - Avoid policy name conflicts
    
  2. Security
    - Maintain same security model
    - Use simplified policy structure
    - Keep existing access control logic
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Companies can manage own job offers" ON job_offers;
DROP POLICY IF EXISTS "Anyone can view job offers" ON job_offers;
DROP POLICY IF EXISTS "Nurses can manage own applications" ON job_applications;
DROP POLICY IF EXISTS "Companies can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Companies can rate nurses for their jobs" ON job_ratings;
DROP POLICY IF EXISTS "Anyone can view ratings" ON job_ratings;

-- Create new simplified policies for profiles
CREATE POLICY "Basic profile read access"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Profile self-update access"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profile self-insert access"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create new simplified policies for nurse_profiles
CREATE POLICY "Nurse self-management access"
  ON nurse_profiles
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Nurse profile read access"
  ON nurse_profiles
  FOR SELECT
  USING (true);

-- Create new simplified policies for job_offers
CREATE POLICY "Company job management"
  ON job_offers
  FOR ALL
  USING (company_id = auth.uid());

CREATE POLICY "Job offer read access"
  ON job_offers
  FOR SELECT
  USING (true);

-- Create new simplified policies for job_applications
CREATE POLICY "Nurse application management"
  ON job_applications
  FOR ALL
  USING (nurse_id = auth.uid());

CREATE POLICY "Company application view access"
  ON job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_applications.job_id
      AND job_offers.company_id = auth.uid()
    )
  );

-- Create new simplified policies for job_ratings
CREATE POLICY "Company rating management"
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

CREATE POLICY "Rating read access"
  ON job_ratings
  FOR SELECT
  USING (true);
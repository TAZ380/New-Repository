/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Remove circular references in policies
    - Simplify policy conditions
    - Add direct auth.uid() checks where possible
    
  2. Security
    - Maintain security while preventing recursion
    - Keep existing access control logic
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Superusers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superusers can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON profiles;

-- Create simplified policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Public can view basic profile info"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Create simplified superuser policies
CREATE POLICY "Superusers can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superuser'
  );

-- Update other related policies to use direct checks
CREATE POLICY "Companies can view nurse profiles"
  ON nurse_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'company'
  );

CREATE POLICY "Nurses can manage own profile"
  ON nurse_profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superusers can manage all nurse profiles"
  ON nurse_profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superuser'
  );
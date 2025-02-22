/*
  # Nurse Profile Details Schema

  1. New Tables
    - `nurse_profiles`
      - `id` (uuid, primary key) - References profiles.id
      - `license_number` (text) - Nursing license number
      - `specialties` (text[]) - Array of specialties
      - `years_experience` (integer) - Total years of experience
      - `education` (jsonb) - Education history
      - `certifications` (jsonb[]) - Array of certifications
      - `availability` (jsonb) - Availability preferences
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Security
    - Enable RLS on `nurse_profiles` table
    - Add policies for:
      - Nurses can read and update their own profile
      - Companies can read basic nurse profile info
*/

-- Create nurse_profiles table
CREATE TABLE IF NOT EXISTS nurse_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  specialties text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  education jsonb DEFAULT '[]',
  certifications jsonb[] DEFAULT '{}',
  availability jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_profile
    FOREIGN KEY(id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE nurse_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Nurses can read own profile"
  ON nurse_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Nurses can update own profile"
  ON nurse_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Companies can read basic nurse info"
  ON nurse_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_nurse_profile_updated_at
  BEFORE UPDATE ON nurse_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
/*
  # Create job offers table and related functionality

  1. New Tables
    - `job_offers`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `rate` (numeric)
      - `shift_date` (date)
      - `shift_start` (time)
      - `shift_end` (time)
      - `specialty` (text)
      - `status` (enum: open, filled, cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `job_applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references job_offers)
      - `nurse_id` (uuid, references profiles)
      - `status` (enum: pending, accepted, rejected)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Companies can manage their own job offers
    - Nurses can view all job offers
    - Nurses can only see their own applications
    - Companies can only see applications for their jobs
*/

-- Create job status enum
CREATE TYPE job_status AS ENUM ('open', 'filled', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create job_offers table
CREATE TABLE IF NOT EXISTS job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  shift_date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  specialty text,
  status job_status DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_shift_times CHECK (shift_start < shift_end)
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_offers(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, nurse_id)
);

-- Enable RLS
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policies for job_offers
CREATE POLICY "Companies can manage their own job offers"
  ON job_offers
  FOR ALL
  TO authenticated
  USING (
    company_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company'
    )
  );

CREATE POLICY "Anyone can view open job offers"
  ON job_offers
  FOR SELECT
  TO authenticated
  USING (status = 'open');

-- Policies for job_applications
CREATE POLICY "Nurses can manage their own applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    nurse_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'nurse'
    )
  );

CREATE POLICY "Companies can view applications for their jobs"
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

-- Create updated_at triggers
CREATE TRIGGER set_job_offers_updated_at
  BEFORE UPDATE ON job_offers
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
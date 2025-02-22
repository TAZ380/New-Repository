/*
  # Add job ratings system

  1. New Tables
    - `job_ratings`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references job_offers)
      - `nurse_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `job_ratings` table
    - Add policies for companies to create ratings
    - Add policies for nurses to view their ratings
*/

-- Create job_ratings table
CREATE TABLE IF NOT EXISTS job_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_offers(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  -- Ensure one rating per job-nurse combination
  UNIQUE(job_id, nurse_id)
);

-- Enable RLS
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;

-- Companies can create ratings for their jobs
CREATE POLICY "Companies can rate nurses for their jobs"
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

-- Companies can view ratings they've given
CREATE POLICY "Companies can view their ratings"
  ON job_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_offers
      WHERE job_offers.id = job_id
      AND job_offers.company_id = auth.uid()
    )
  );

-- Nurses can view their own ratings
CREATE POLICY "Nurses can view their own ratings"
  ON job_ratings
  FOR SELECT
  TO authenticated
  USING (nurse_id = auth.uid());
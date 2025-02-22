/*
  # Create nurse shifts table

  1. New Tables
    - `nurse_shifts`
      - `id` (uuid, primary key)
      - `nurse_id` (uuid, references profiles)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `location` (text)
      - `notes` (text)
      - `status` (enum: pending, confirmed, completed, cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for nurse access
*/

-- Create shift status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create nurse_shifts table
CREATE TABLE IF NOT EXISTS nurse_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  notes text,
  status shift_status DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_shift_times CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE nurse_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Nurses can manage their own shifts"
  ON nurse_shifts
  FOR ALL
  TO authenticated
  USING (nurse_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER set_nurse_shifts_updated_at
  BEFORE UPDATE ON nurse_shifts
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TABLE nurse_shifts IS 'Turnos personales de enfermeros';
COMMENT ON COLUMN nurse_shifts.date IS 'Fecha del turno';
COMMENT ON COLUMN nurse_shifts.start_time IS 'Hora de inicio';
COMMENT ON COLUMN nurse_shifts.end_time IS 'Hora de fin';
COMMENT ON COLUMN nurse_shifts.location IS 'Ubicación';
COMMENT ON COLUMN nurse_shifts.notes IS 'Notas adicionales';
COMMENT ON COLUMN nurse_shifts.status IS 'Estado del turno';
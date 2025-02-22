/*
  # Add shift management tables

  1. New Tables
    - `nurse_custom_shifts`: Stores custom shift templates
      - `id` (uuid, primary key)
      - `nurse_id` (uuid, references profiles)
      - `name` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `icon` (text)
      - `color` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to existing tables
    - Add new columns to `nurse_shifts`:
      - `shift_type` (text)
      - `custom_shift_id` (uuid, references nurse_custom_shifts)
      - `color` (text)
      - `icon` (text)
      - `modified` (boolean)
      - `reassigned` (boolean)

  3. Security
    - Enable RLS on new tables
    - Add policies for nurse access
*/

-- Create nurse_custom_shifts table
CREATE TABLE IF NOT EXISTS nurse_custom_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_custom_shift_times CHECK (start_time < end_time),
  CONSTRAINT max_custom_shifts_per_nurse UNIQUE (nurse_id, name)
);

-- Add new columns to nurse_shifts
ALTER TABLE nurse_shifts 
  ADD COLUMN IF NOT EXISTS shift_type text,
  ADD COLUMN IF NOT EXISTS custom_shift_id uuid REFERENCES nurse_custom_shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS modified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reassigned boolean DEFAULT false;

-- Enable RLS
ALTER TABLE nurse_custom_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for nurse_custom_shifts
CREATE POLICY "Nurses can manage their own custom shifts"
  ON nurse_custom_shifts
  FOR ALL
  TO authenticated
  USING (nurse_id = auth.uid());

-- Create updated_at trigger for nurse_custom_shifts
CREATE TRIGGER set_nurse_custom_shifts_updated_at
  BEFORE UPDATE ON nurse_custom_shifts
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TABLE nurse_custom_shifts IS 'Turnos personalizados de enfermeros';
COMMENT ON COLUMN nurse_custom_shifts.name IS 'Nombre del turno personalizado';
COMMENT ON COLUMN nurse_custom_shifts.start_time IS 'Hora de inicio';
COMMENT ON COLUMN nurse_custom_shifts.end_time IS 'Hora de fin';
COMMENT ON COLUMN nurse_custom_shifts.icon IS 'Icono del turno';
COMMENT ON COLUMN nurse_custom_shifts.color IS 'Color del turno';

COMMENT ON COLUMN nurse_shifts.shift_type IS 'Tipo de turno (predefinido o personalizado)';
COMMENT ON COLUMN nurse_shifts.custom_shift_id IS 'ID del turno personalizado si aplica';
COMMENT ON COLUMN nurse_shifts.color IS 'Color del turno';
COMMENT ON COLUMN nurse_shifts.icon IS 'Icono del turno';
COMMENT ON COLUMN nurse_shifts.modified IS 'Indica si el turno ha sido modificado';
COMMENT ON COLUMN nurse_shifts.reassigned IS 'Indica si el turno ha sido reasignado';
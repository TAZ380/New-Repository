-- Add missing columns to nurse_shifts
ALTER TABLE nurse_shifts 
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS shift_type text;

-- Create nurse_custom_shifts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'nurse_custom_shifts') THEN
    CREATE TABLE nurse_custom_shifts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      name text NOT NULL,
      start_time time NOT NULL,
      end_time time NOT NULL,
      icon text NOT NULL,
      color text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT valid_custom_shift_times CHECK (start_time < end_time)
    );

    -- Enable RLS
    ALTER TABLE nurse_custom_shifts ENABLE ROW LEVEL SECURITY;

    -- Create policies for nurse_custom_shifts
    CREATE POLICY "nurse_custom_shifts_self_access"
      ON nurse_custom_shifts
      FOR ALL
      TO authenticated
      USING (nurse_id = auth.uid());
  END IF;
END $$;

-- Add Spanish translations
COMMENT ON TABLE nurse_custom_shifts IS 'Turnos personalizados de enfermeros';
COMMENT ON COLUMN nurse_custom_shifts.name IS 'Nombre del turno personalizado';
COMMENT ON COLUMN nurse_custom_shifts.start_time IS 'Hora de inicio';
COMMENT ON COLUMN nurse_custom_shifts.end_time IS 'Hora de fin';
COMMENT ON COLUMN nurse_custom_shifts.icon IS 'Icono del turno';
COMMENT ON COLUMN nurse_custom_shifts.color IS 'Color del turno';

COMMENT ON COLUMN nurse_shifts.color IS 'Color del turno';
COMMENT ON COLUMN nurse_shifts.icon IS 'Icono del turno';
COMMENT ON COLUMN nurse_shifts.shift_type IS 'Tipo de turno';
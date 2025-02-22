-- Create nurse_experiences table
CREATE TABLE IF NOT EXISTS nurse_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_name text NOT NULL,
  position text NOT NULL,
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  current boolean DEFAULT false,
  description text NOT NULL,
  specialties text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (
    (current = true AND end_date IS NULL) OR
    (current = false AND end_date IS NOT NULL AND end_date > start_date)
  )
);

-- Enable RLS
ALTER TABLE nurse_experiences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Nurses can manage their own experiences"
  ON nurse_experiences
  FOR ALL
  TO authenticated
  USING (nurse_id = auth.uid());

CREATE POLICY "Anyone can read nurse experiences"
  ON nurse_experiences
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER set_nurse_experiences_updated_at
  BEFORE UPDATE ON nurse_experiences
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TABLE nurse_experiences IS 'Experiencia profesional de enfermeros';
COMMENT ON COLUMN nurse_experiences.hospital_name IS 'Nombre del centro hospitalario';
COMMENT ON COLUMN nurse_experiences.position IS 'Puesto desempeñado';
COMMENT ON COLUMN nurse_experiences.location IS 'Ubicación del centro';
COMMENT ON COLUMN nurse_experiences.start_date IS 'Fecha de inicio';
COMMENT ON COLUMN nurse_experiences.end_date IS 'Fecha de fin';
COMMENT ON COLUMN nurse_experiences.current IS 'Indica si es el trabajo actual';
COMMENT ON COLUMN nurse_experiences.description IS 'Descripción de responsabilidades';
COMMENT ON COLUMN nurse_experiences.specialties IS 'Especialidades practicadas';
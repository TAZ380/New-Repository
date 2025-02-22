-- Create nurse_notes table
CREATE TABLE IF NOT EXISTS nurse_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, nurse_id)
);

-- Enable RLS
ALTER TABLE nurse_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Companies can manage their own notes"
  ON nurse_notes
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER set_nurse_notes_updated_at
  BEFORE UPDATE ON nurse_notes
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add subscription_status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';

-- Add Spanish translations
COMMENT ON TABLE nurse_notes IS 'Notas privadas sobre enfermeros';
COMMENT ON COLUMN nurse_notes.note IS 'Contenido de la nota';
COMMENT ON COLUMN profiles.subscription_status IS 'Estado de la suscripción (free/premium)';
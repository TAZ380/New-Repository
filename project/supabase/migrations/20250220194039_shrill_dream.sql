-- Drop existing policies and trigger first to avoid conflicts
DROP POLICY IF EXISTS "contracts_nurse_select_new" ON contracts;
DROP POLICY IF EXISTS "contracts_company_select_new" ON contracts;
DROP POLICY IF EXISTS "contracts_company_insert_new" ON contracts;
DROP POLICY IF EXISTS "contracts_nurse_update_new" ON contracts;
DROP POLICY IF EXISTS "contracts_company_update_new" ON contracts;
DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts;

-- Create contract status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
  END IF;
END $$;

-- Create or update contracts table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    CREATE TABLE contracts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      company_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      shift_date date NOT NULL,
      shift_type text NOT NULL,
      shift_start time NOT NULL,
      shift_end time NOT NULL,
      rate numeric NOT NULL CHECK (rate > 0),
      status contract_status DEFAULT 'pending',
      nurse_rating integer CHECK (nurse_rating >= 1 AND nurse_rating <= 5),
      nurse_review text,
      company_rating integer CHECK (company_rating >= 1 AND company_rating <= 5),
      company_review text,
      nurse_notes text,
      company_notes text,
      contract_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT valid_shift_times CHECK (shift_start < shift_end)
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'contracts' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create new policies with unique names
CREATE POLICY "contracts_nurse_select_v2"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (nurse_id = auth.uid());

CREATE POLICY "contracts_company_select_v2"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "contracts_company_insert_v2"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'company' OR role = 'individual')
    )
  );

CREATE POLICY "contracts_nurse_update_v2"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    nurse_id = auth.uid()
  );

CREATE POLICY "contracts_company_update_v2"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    company_id = auth.uid()
  );

-- Create updated_at trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_contracts_updated_at'
  ) THEN
    CREATE TRIGGER set_contracts_updated_at
      BEFORE UPDATE ON contracts
      FOR EACH ROW
      EXECUTE PROCEDURE handle_updated_at();
  END IF;
END $$;

-- Add Spanish translations
COMMENT ON TABLE contracts IS 'Contratos entre enfermeros y empresas/particulares';
COMMENT ON COLUMN contracts.shift_date IS 'Fecha del turno';
COMMENT ON COLUMN contracts.shift_type IS 'Tipo de turno';
COMMENT ON COLUMN contracts.shift_start IS 'Hora de inicio';
COMMENT ON COLUMN contracts.shift_end IS 'Hora de fin';
COMMENT ON COLUMN contracts.rate IS 'Tarifa por hora';
COMMENT ON COLUMN contracts.status IS 'Estado del contrato';
COMMENT ON COLUMN contracts.nurse_rating IS 'Valoración del enfermero (1-5)';
COMMENT ON COLUMN contracts.nurse_review IS 'Comentario del enfermero';
COMMENT ON COLUMN contracts.company_rating IS 'Valoración de la empresa (1-5)';
COMMENT ON COLUMN contracts.company_review IS 'Comentario de la empresa';
COMMENT ON COLUMN contracts.nurse_notes IS 'Notas privadas del enfermero';
COMMENT ON COLUMN contracts.company_notes IS 'Notas privadas de la empresa';
COMMENT ON COLUMN contracts.contract_url IS 'URL del documento del contrato';
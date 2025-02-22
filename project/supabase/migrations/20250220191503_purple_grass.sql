-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contracts_nurse_select" ON contracts;
DROP POLICY IF EXISTS "contracts_company_select" ON contracts;
DROP POLICY IF EXISTS "contracts_company_insert" ON contracts;
DROP POLICY IF EXISTS "contracts_nurse_update" ON contracts;
DROP POLICY IF EXISTS "contracts_company_update" ON contracts;

-- Create or update policies
CREATE POLICY "contracts_nurse_select"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (nurse_id = auth.uid());

CREATE POLICY "contracts_company_select"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "contracts_company_insert"
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

CREATE POLICY "contracts_nurse_update"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    nurse_id = auth.uid()
  );

CREATE POLICY "contracts_company_update"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    company_id = auth.uid()
  );
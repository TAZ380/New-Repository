/*
  # Update contracts table schema

  1. Changes
    - Adds missing columns to contracts table
    - Updates existing policies with proper constraints
    - Adds new indexes for performance

  2. Security
    - Maintains existing RLS policies
    - Adds additional constraints for data integrity
*/

-- Add missing columns to contracts table if they don't exist
DO $$ 
BEGIN
  ALTER TABLE contracts 
    ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_date timestamptz,
    ADD COLUMN IF NOT EXISTS payment_amount numeric,
    ADD COLUMN IF NOT EXISTS payment_method text,
    ADD COLUMN IF NOT EXISTS invoice_url text,
    ADD COLUMN IF NOT EXISTS payment_notes text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add payment status check constraint
DO $$ 
BEGIN
  ALTER TABLE contracts
    ADD CONSTRAINT valid_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add payment amount constraint
DO $$ 
BEGIN
  ALTER TABLE contracts
    ADD CONSTRAINT valid_payment_amount
    CHECK (payment_amount > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS contracts_nurse_id_idx ON contracts(nurse_id);
CREATE INDEX IF NOT EXISTS contracts_company_id_idx ON contracts(company_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(status);
CREATE INDEX IF NOT EXISTS contracts_payment_status_idx ON contracts(payment_status);
CREATE INDEX IF NOT EXISTS contracts_shift_date_idx ON contracts(shift_date);

-- Add Spanish translations for new columns
COMMENT ON COLUMN contracts.payment_status IS 'Estado del pago';
COMMENT ON COLUMN contracts.payment_date IS 'Fecha del pago';
COMMENT ON COLUMN contracts.payment_amount IS 'Importe del pago';
COMMENT ON COLUMN contracts.payment_method IS 'Método de pago';
COMMENT ON COLUMN contracts.invoice_url IS 'URL de la factura';
COMMENT ON COLUMN contracts.payment_notes IS 'Notas sobre el pago';
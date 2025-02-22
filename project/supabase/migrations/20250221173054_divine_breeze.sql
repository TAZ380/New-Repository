-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_payment_method CHECK (method IN ('credit_card', 'bank_transfer', 'paypal'))
);

-- Enable RLS
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payments"
  ON subscription_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER set_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TABLE subscription_payments IS 'Pagos de suscripciones';
COMMENT ON COLUMN subscription_payments.date IS 'Fecha del pago';
COMMENT ON COLUMN subscription_payments.amount IS 'Importe del pago';
COMMENT ON COLUMN subscription_payments.method IS 'Método de pago';
COMMENT ON COLUMN subscription_payments.status IS 'Estado del pago';
COMMENT ON COLUMN subscription_payments.invoice_url IS 'URL de la factura';
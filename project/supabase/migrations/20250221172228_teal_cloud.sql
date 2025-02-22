/*
  # Add Languages Support

  1. Changes
    - Add languages array column to profiles table
    - Add payment_methods jsonb column to profiles table
    - Add Spanish translations for new columns

  2. Notes
    - Languages are stored as an array of language codes
    - Payment methods are stored as a JSONB array of objects
*/

-- Add languages column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]';

-- Add Spanish translations
COMMENT ON COLUMN profiles.languages IS 'Idiomas que habla el usuario';
COMMENT ON COLUMN profiles.payment_methods IS 'Métodos de pago configurados';
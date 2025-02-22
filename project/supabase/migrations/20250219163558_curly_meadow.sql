/*
  # Fix document upload system

  1. Changes
    - Create unified user_documents table for all user types
    - Update storage policies to handle all user types
    - Add proper RLS policies for document access

  2. Security
    - Enable RLS on user_documents table
    - Add policies for document access and management
    - Update storage policies for secure file handling
*/

-- Drop existing nurse_documents table if it exists
DROP TABLE IF EXISTS nurse_documents;

-- Create unified user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  status document_status DEFAULT 'pending_review',
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  rejection_reason text,
  UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for user_documents
CREATE POLICY "Users can manage their own documents"
  ON user_documents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superusers can manage all documents"
  ON user_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TABLE user_documents IS 'Documentos de usuarios';
COMMENT ON COLUMN user_documents.document_type IS 'Tipo de documento';
COMMENT ON COLUMN user_documents.status IS 'Estado del documento';
COMMENT ON COLUMN user_documents.file_path IS 'Ruta del archivo';
COMMENT ON COLUMN user_documents.reviewed_at IS 'Fecha de revisión';
COMMENT ON COLUMN user_documents.reviewed_by IS 'Revisado por';
COMMENT ON COLUMN user_documents.rejection_reason IS 'Motivo de rechazo';

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Nurses can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Nurses can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Superusers can access all documents" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Superusers can access all documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );
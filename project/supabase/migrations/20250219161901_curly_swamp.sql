/*
  # Create nurse documents table

  1. New Tables
    - `nurse_documents`
      - `id` (uuid, primary key)
      - `nurse_id` (uuid, references profiles)
      - `document_type` (text)
      - `status` (document_status)
      - `file_path` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `reviewed_at` (timestamp)
      - `reviewed_by` (uuid, references profiles)

  2. New Types
    - `document_status`: Estado del documento
      - pending_review: Pendiente de revisión
      - approved: Aprobado
      - rejected: Rechazado

  3. Security
    - Enable RLS
    - Policies for document access and management
*/

-- Create document status enum
CREATE TYPE document_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Create nurse_documents table
CREATE TABLE IF NOT EXISTS nurse_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  status document_status DEFAULT 'pending_review',
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  UNIQUE(nurse_id, document_type)
);

-- Enable RLS
ALTER TABLE nurse_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Nurses can manage their own documents"
  ON nurse_documents
  FOR ALL
  TO authenticated
  USING (nurse_id = auth.uid());

CREATE POLICY "Superusers can manage all documents"
  ON nurse_documents
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
CREATE TRIGGER set_nurse_documents_updated_at
  BEFORE UPDATE ON nurse_documents
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add Spanish translations
COMMENT ON TYPE document_status IS 'Estado del documento:
  - pending_review: Pendiente de revisión
  - approved: Aprobado
  - rejected: Rechazado';

COMMENT ON TABLE nurse_documents IS 'Documentos de enfermeros';
COMMENT ON COLUMN nurse_documents.document_type IS 'Tipo de documento';
COMMENT ON COLUMN nurse_documents.status IS 'Estado del documento';
COMMENT ON COLUMN nurse_documents.file_path IS 'Ruta del archivo';
COMMENT ON COLUMN nurse_documents.reviewed_at IS 'Fecha de revisión';
COMMENT ON COLUMN nurse_documents.reviewed_by IS 'Revisado por';

-- Create storage bucket for nurse documents
INSERT INTO storage.buckets (id, name)
VALUES ('nurse-documents', 'nurse-documents')
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Nurses can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nurse-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Nurses can read their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'nurse-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Superusers can access all documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'nurse-documents' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );
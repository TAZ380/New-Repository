/*
  # Add notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text)
      - `title` (text)
      - `message` (text)
      - `shift_id` (uuid, optional)
      - `company_name` (text, optional)
      - `shift_date` (date, optional)
      - `shift_start` (time, optional)
      - `shift_end` (time, optional)
      - `status` (text)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, optional)
      - `actions` (jsonb, optional)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for authenticated users to manage their own notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  shift_id uuid REFERENCES nurse_shifts(id) ON DELETE CASCADE,
  company_name text,
  shift_date date,
  shift_start time,
  shift_end time,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  actions jsonb,
  CONSTRAINT valid_notification_type CHECK (
    type IN ('shift_reminder', 'shift_confirmation', 'shift_change', 'shift_cancellation')
  ),
  CONSTRAINT valid_notification_status CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'change_requested')
  )
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Add Spanish translations
COMMENT ON TABLE notifications IS 'Notificaciones del sistema';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación';
COMMENT ON COLUMN notifications.title IS 'Título de la notificación';
COMMENT ON COLUMN notifications.message IS 'Mensaje de la notificación';
COMMENT ON COLUMN notifications.shift_id IS 'ID del turno relacionado';
COMMENT ON COLUMN notifications.company_name IS 'Nombre de la empresa';
COMMENT ON COLUMN notifications.shift_date IS 'Fecha del turno';
COMMENT ON COLUMN notifications.shift_start IS 'Hora de inicio del turno';
COMMENT ON COLUMN notifications.shift_end IS 'Hora de fin del turno';
COMMENT ON COLUMN notifications.status IS 'Estado de la notificación';
COMMENT ON COLUMN notifications.read_at IS 'Fecha de lectura';
COMMENT ON COLUMN notifications.actions IS 'Acciones disponibles';
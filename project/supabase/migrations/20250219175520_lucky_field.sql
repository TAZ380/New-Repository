/*
  # Corregir políticas RLS para las tablas de turnos

  1. Cambios
    - Simplificar y corregir las políticas RLS para nurse_shifts
    - Simplificar y corregir las políticas RLS para nurse_custom_shifts
    - Asegurar que los enfermeros puedan gestionar sus propios turnos
*/

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "nurse_custom_shifts_self_access" ON nurse_custom_shifts;
DROP POLICY IF EXISTS "Nurses can manage their own custom shifts" ON nurse_custom_shifts;
DROP POLICY IF EXISTS "Nurses can manage their own shifts" ON nurse_shifts;

-- Crear nuevas políticas simplificadas para nurse_shifts
CREATE POLICY "shifts_self_access"
  ON nurse_shifts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'nurse'
    )
  );

-- Crear nuevas políticas simplificadas para nurse_custom_shifts
CREATE POLICY "custom_shifts_self_access"
  ON nurse_custom_shifts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'nurse'
    )
  );
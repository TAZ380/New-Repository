/*
  # Corregir manejo de turnos nocturnos

  1. Cambios
    - Eliminar la restricción de tiempo que no permite turnos que cruzan la medianoche
    - Añadir una columna para indicar si el turno cruza la medianoche
*/

-- Eliminar la restricción existente de nurse_shifts
ALTER TABLE nurse_shifts 
  DROP CONSTRAINT IF EXISTS valid_shift_times;

-- Eliminar la restricción existente de nurse_custom_shifts
ALTER TABLE nurse_custom_shifts 
  DROP CONSTRAINT IF EXISTS valid_custom_shift_times;

-- Añadir columna para indicar si el turno cruza la medianoche
ALTER TABLE nurse_shifts 
  ADD COLUMN IF NOT EXISTS crosses_midnight boolean 
  GENERATED ALWAYS AS (
    CASE 
      WHEN start_time > end_time THEN true
      ELSE false
    END
  ) STORED;

ALTER TABLE nurse_custom_shifts 
  ADD COLUMN IF NOT EXISTS crosses_midnight boolean 
  GENERATED ALWAYS AS (
    CASE 
      WHEN start_time > end_time THEN true
      ELSE false
    END
  ) STORED;

-- Añadir comentarios en español
COMMENT ON COLUMN nurse_shifts.crosses_midnight IS 'Indica si el turno cruza la medianoche';
COMMENT ON COLUMN nurse_custom_shifts.crosses_midnight IS 'Indica si el turno cruza la medianoche';
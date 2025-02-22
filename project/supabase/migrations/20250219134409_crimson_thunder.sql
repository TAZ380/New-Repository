/*
  # Spanish Translation Migration

  1. Changes
    - Add Spanish translations for job status and application status enums
    - Update existing enums with Spanish values
    - Keep existing English values for backward compatibility
*/

-- Add Spanish translations for job status
COMMENT ON TYPE job_status IS 'Estado de la oferta de trabajo:
  - open: Abierta
  - filled: Cubierta
  - cancelled: Cancelada';

-- Add Spanish translations for application status
COMMENT ON TYPE application_status IS 'Estado de la aplicación:
  - pending: Pendiente
  - accepted: Aceptada
  - rejected: Rechazada';

-- Add Spanish translations for user roles
COMMENT ON TYPE user_role IS 'Tipo de usuario:
  - nurse: Enfermero/a
  - company: Empresa
  - individual: Particular
  - superuser: Administrador';

-- Add Spanish column comments
COMMENT ON TABLE profiles IS 'Perfiles de usuario';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario';
COMMENT ON COLUMN profiles.verified IS 'Usuario verificado';
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo';
COMMENT ON COLUMN profiles.phone IS 'Teléfono';
COMMENT ON COLUMN profiles.location IS 'Ubicación';

COMMENT ON TABLE nurse_profiles IS 'Perfiles de enfermeros';
COMMENT ON COLUMN nurse_profiles.license_number IS 'Número de colegiado';
COMMENT ON COLUMN nurse_profiles.specialties IS 'Especialidades';
COMMENT ON COLUMN nurse_profiles.years_experience IS 'Años de experiencia';
COMMENT ON COLUMN nurse_profiles.education IS 'Formación académica';
COMMENT ON COLUMN nurse_profiles.certifications IS 'Certificaciones';
COMMENT ON COLUMN nurse_profiles.availability IS 'Disponibilidad';

COMMENT ON TABLE job_offers IS 'Ofertas de trabajo';
COMMENT ON COLUMN job_offers.title IS 'Título';
COMMENT ON COLUMN job_offers.description IS 'Descripción';
COMMENT ON COLUMN job_offers.location IS 'Ubicación';
COMMENT ON COLUMN job_offers.rate IS 'Tarifa por hora';
COMMENT ON COLUMN job_offers.shift_date IS 'Fecha del turno';
COMMENT ON COLUMN job_offers.shift_start IS 'Hora de inicio';
COMMENT ON COLUMN job_offers.shift_end IS 'Hora de fin';
COMMENT ON COLUMN job_offers.specialty IS 'Especialidad requerida';
COMMENT ON COLUMN job_offers.status IS 'Estado de la oferta';

COMMENT ON TABLE job_applications IS 'Solicitudes de trabajo';
COMMENT ON COLUMN job_applications.status IS 'Estado de la solicitud';

COMMENT ON TABLE job_ratings IS 'Valoraciones de trabajo';
COMMENT ON COLUMN job_ratings.rating IS 'Puntuación (1-5)';
COMMENT ON COLUMN job_ratings.comment IS 'Comentario';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  GraduationCap, 
  Award, 
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';

const nurseProfileSchema = z.object({
  license_number: z.string().min(5, 'El número de colegiado es demasiado corto'),
  specialties: z.array(z.string()).min(1, 'Selecciona al menos una especialidad'),
  years_experience: z.number().min(0, 'Los años deben ser 0 o más'),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number()
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number()
  })),
  availability: z.object({
    weekdays: z.boolean(),
    weekends: z.boolean(),
    nights: z.boolean()
  })
});

const specialtiesList = [
  'Enfermería General',
  'UCI',
  'Urgencias',
  'Pediatría',
  'Geriatría',
  'Salud Mental',
  'Quirófano',
  'Oncología',
  'Maternidad'
];

export function NurseProfileCompletion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    license_number: '',
    specialties: [] as string[],
    years_experience: 0,
    education: [{ degree: '', institution: '', year: new Date().getFullYear() }],
    certifications: [] as { name: string; issuer: string; year: number }[],
    availability: {
      weekdays: true,
      weekends: false,
      nights: false
    }
  });

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      nurseProfileSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No se ha encontrado usuario');

      const { error: profileError } = await supabase
        .from('nurse_profiles')
        .insert([
          {
            id: user.id,
            ...formData
          }
        ]);

      if (profileError) throw profileError;

      // Update verification status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verified: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      navigate('/upload-documents');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-xl rounded-lg p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Completa tu Perfil de Enfermero</h2>
          <p className="mt-2 text-gray-600">Cuéntanos sobre tus cualificaciones y experiencia</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Número de Colegiado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600" />
                <span>Número de Colegiado</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              className="input-primary"
              placeholder="Introduce tu número de colegiado"
            />
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-blue-600" />
                <span>Especialidades</span>
              </div>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialtiesList.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors
                    ${formData.specialties.includes(specialty)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Años de Experiencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-600" />
                <span>Años de Experiencia</span>
              </div>
            </label>
            <input
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })}
              className="input-primary"
            />
          </div>

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                <span>Disponibilidad</span>
              </div>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'weekdays', label: 'Entre semana' },
                { key: 'weekends', label: 'Fines de semana' },
                { key: 'nights', label: 'Noches' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.availability[key as keyof typeof formData.availability]}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: {
                        ...formData.availability,
                        [key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <p className="text-sm text-gray-600 text-center">
            A continuación, necesitaremos que subas tu documentación para verificar tu perfil
          </p>
        </form>
      </div>
    </div>
  );
}
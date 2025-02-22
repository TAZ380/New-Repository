import React, { useState } from 'react';
import { 
  Briefcase,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Building,
  MapPin,
  AlertCircle,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

interface Experience {
  id: string;
  hospital_name: string;
  position: string;
  location: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  specialties: string[];
}

export function ExperienceTimeline() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Experience, 'id'>>({
    hospital_name: '',
    position: '',
    location: '',
    start_date: '',
    end_date: '',
    current: false,
    description: '',
    specialties: []
  });

  React.useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error: fetchError } = await supabase
        .from('nurse_experiences')
        .select('*')
        .eq('nurse_id', user.id)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;
      setExperiences(data || []);
    } catch (err) {
      console.error('Error loading experiences:', err);
      setError('Error al cargar la experiencia profesional');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      if (editingId) {
        const { error: updateError } = await supabase
          .from('nurse_experiences')
          .update({
            ...formData,
            end_date: formData.current ? null : formData.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('nurse_experiences')
          .insert([{
            nurse_id: user.id,
            ...formData,
            end_date: formData.current ? null : formData.end_date
          }]);

        if (insertError) throw insertError;
      }

      await loadExperiences();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        hospital_name: '',
        position: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: '',
        specialties: []
      });
    } catch (err) {
      console.error('Error saving experience:', err);
      setError('Error al guardar la experiencia');
    }
  };

  const handleEdit = (experience: Experience) => {
    setFormData({
      hospital_name: experience.hospital_name,
      position: experience.position,
      location: experience.location,
      start_date: experience.start_date,
      end_date: experience.end_date || '',
      current: experience.current,
      description: experience.description,
      specialties: experience.specialties
    });
    setEditingId(experience.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('nurse_experiences')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await loadExperiences();
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError('Error al eliminar la experiencia');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Experiencia Profesional</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              hospital_name: '',
              position: '',
              location: '',
              start_date: '',
              end_date: '',
              current: false,
              description: '',
              specialties: []
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Añadir Experiencia</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Experience Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Editar Experiencia' : 'Añadir Nueva Experiencia'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hospital Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centro Hospitalario
                  </label>
                  <input
                    type="text"
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puesto
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={formData.specialties.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="UCI, Pediatría, etc."
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={formData.current}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.current}
                        onChange={(e) => setFormData({ ...formData, current: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Trabajo actual</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Guardar Cambios' : 'Añadir Experiencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {experiences.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay experiencia registrada</h3>
            <p className="text-gray-500 mt-2">
              Añade tu experiencia profesional para que los empleadores puedan conocer tu trayectoria.
            </p>
          </div>
        ) : (
          <div className="border-l-2 border-blue-200">
            {experiences.map((experience, index) => (
              <div
                key={experience.id}
                className={`relative pl-8 pb-8 ${
                  index === experiences.length - 1 ? '' : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute -left-2.5 mt-1.5 w-5 h-5 bg-blue-600 rounded-full border-4 border-white" />

                {/* Experience Card */}
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {experience.position}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Building className="h-4 w-4" />
                        <span>{experience.hospital_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(experience.start_date), 'MMM yyyy', { locale: es })} -{' '}
                          {experience.current
                            ? 'Actualidad'
                            : format(new Date(experience.end_date!), 'MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(experience)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Specialties */}
                  {experience.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {experience.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="mt-4 text-gray-600 whitespace-pre-line">
                    {experience.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
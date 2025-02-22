import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  User,
  Star,
  Building,
  MessageSquare,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Lock,
  FileText,
  Download,
  Edit2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  location: z.string().min(3, 'La ubicación es obligatoria'),
  rate: z.number().min(10, 'La tarifa debe ser al menos 10'),
  shift_date: z.string().min(1, 'La fecha es obligatoria'),
  shift_start: z.string().min(1, 'La hora de inicio es obligatoria'),
  shift_end: z.string().min(1, 'La hora de fin es obligatoria'),
  specialty: z.string().optional()
});

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Por favor, proporciona un comentario más detallado')
});

interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string;
  rate: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  specialty: string;
  status: 'open' | 'filled' | 'cancelled';
  created_at: string;
  applications: {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    nurse: {
      id: string;
      full_name: string;
      nurse_profile: {
        license_number: string;
        years_experience: number;
        specialties: string[];
      };
    };
    created_at: string;
  }[];
  rating?: {
    rating: number;
    comment: string;
  };
}

interface NurseNote {
  id: string;
  nurse_id: string;
  note: string;
  created_at: string;
}

interface NurseApplicationCardProps {
  application: {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    nurse: {
      id: string;
      full_name: string;
      nurse_profile: {
        license_number: string;
        years_experience: number;
        specialties: string[];
      };
    };
    created_at: string;
  };
  onStatusChange: (id: string, status: 'accepted' | 'rejected') => void;
  onRating: () => void;
  privateNote: string;
  onNoteUpdate: (note: string) => void;
  isEditingNote: boolean;
  onEditNote: () => void;
  companyRole: 'company' | 'individual';
  onGenerateContract: () => void;
  rating?: {
    rating: number;
    comment: string;
  };
}

function NurseApplicationCard({
  application,
  onStatusChange,
  onRating,
  privateNote,
  onNoteUpdate,
  isEditingNote,
  onEditNote,
  companyRole,
  onGenerateContract,
  rating
}: NurseApplicationCardProps) {
  const [note, setNote] = useState(privateNote);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">{application.nurse.full_name}</h4>
          <p className="text-sm text-gray-600">
            {application.nurse.nurse_profile.years_experience} años de experiencia
          </p>
        </div>
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${
          application.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : application.status === 'accepted'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {application.status === 'pending' ? 'Pendiente' : 
           application.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
        </span>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-2 mb-4">
        {application.nurse.nurse_profile.specialties.map((specialty) => (
          <span key={specialty} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {specialty}
          </span>
        ))}
      </div>

      {/* Private Notes */}
      <div className="mb-4">
        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
              placeholder="Añade una nota privada sobre esta enfermera..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onEditNote()}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onNoteUpdate(note);
                  onEditNote();
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between group">
            <p className="text-sm text-gray-600">
              {privateNote || 'Sin notas privadas'}
            </p>
            <button
              onClick={onEditNote}
              className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {application.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusChange(application.id, 'accepted')}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <CheckCircle size={16} />
              <span className="text-sm">Aceptar</span>
            </button>
            <button
              onClick={() => onStatusChange(application.id, 'rejected')}
              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <XCircle size={16} />
              <span className="text-sm">Rechazar</span>
            </button>
          </>
        )}

        {application.status === 'accepted' && !rating && (
          <button
            onClick={onRating}
            className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
          >
            <Star size={16} />
            <span className="text-sm">Valorar</span>
          </button>
        )}

        {companyRole === 'individual' && application.status === 'accepted' && (
          <button
            onClick={onGenerateContract}
            className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            <FileText size={16} />
            <span className="text-sm">Generar Contrato</span>
          </button>
        )}
      </div>

      {/* Rating Display */}
      {rating && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <Star size={16} className="fill-current" />
            <span className="font-medium">{rating.rating}/5</span>
          </div>
          <p className="text-sm text-yellow-800">{rating.comment}</p>
        </div>
      )}
    </div>
  );
}

export function CompanyDashboard() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState<{jobId: string, nurseId: string} | null>(null);
  const [ratingFormData, setRatingFormData] = useState({ rating: 5, comment: '' });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'filled' | 'cancelled'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    rate: 0,
    shift_date: '',
    shift_start: '',
    shift_end: '',
    specialty: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showingAllNurses, setShowingAllNurses] = useState(false);
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [companyRole, setCompanyRole] = useState<'company' | 'individual'>('company');

  useEffect(() => {
    loadCompanyProfile();
    loadJobs();
    loadNurseNotes();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, subscription_status')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setCompanyRole(profile.role as 'company' | 'individual');
      setIsPremium(profile.subscription_status === 'premium');
    } catch (err) {
      console.error('Error loading company profile:', err);
    }
  };

  const loadJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_offers')
        .select(`
          *,
          applications:job_applications(
            id,
            status,
            created_at,
            nurse:profiles(
              id,
              full_name,
              nurse_profile:nurse_profiles(
                license_number,
                years_experience,
                specialties
              )
            )
          ),
          ratings:job_ratings(
            rating,
            comment
          )
        `)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const loadNurseNotes = async () => {
    try {
      const { data: notes, error: notesError } = await supabase
        .from('nurse_notes')
        .select('*');

      if (notesError) throw notesError;

      const notesMap: Record<string, string> = {};
      notes?.forEach(note => {
        notesMap[note.nurse_id] = note.note;
      });
      setPrivateNotes(notesMap);
    } catch (err) {
      console.error('Error loading nurse notes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const validatedData = jobSchema.parse(formData);

      const { error: submitError } = await supabase
        .from('job_offers')
        .insert([validatedData]);

      if (submitError) throw submitError;

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        rate: 0,
        shift_date: '',
        shift_start: '',
        shift_end: '',
        specialty: ''
      });
      loadJobs();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al crear la oferta de trabajo');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      setProcessingApplication(applicationId);
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        const application = jobs
          .flatMap(job => job.applications)
          .find(app => app.id === applicationId);
        
        if (application) {
          const { error: jobError } = await supabase
            .from('job_offers')
            .update({ status: 'filled' })
            .eq('id', jobs.find(job => 
              job.applications.some(app => app.id === applicationId)
            )?.id);

          if (jobError) throw jobError;
        }
      }

      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la solicitud');
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRatingForm) return;

    try {
      setSubmittingRating(true);
      const validatedData = ratingSchema.parse(ratingFormData);

      const { error: ratingError } = await supabase
        .from('job_ratings')
        .insert([{
          job_id: showRatingForm.jobId,
          nurse_id: showRatingForm.nurseId,
          ...validatedData
        }]);

      if (ratingError) throw ratingError;

      setShowRatingForm(null);
      setRatingFormData({ rating: 5, comment: '' });
      await loadJobs();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al enviar la valoración');
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleNoteUpdate = async (nurseId: string, note: string) => {
    try {
      const { error: noteError } = await supabase
        .from('nurse_notes')
        .upsert([
          {
            nurse_id: nurseId,
            note
          }
        ]);

      if (noteError) throw noteError;

      setPrivateNotes(prev => ({
        ...prev,
        [nurseId]: note
      }));
      setEditingNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la nota');
    }
  };

  const generateContract = async (application: any) => {
    try {
      // In a real implementation, this would use a PDF generation library
      // For now, we'll create a simple text file
      const contractText = `
CONTRATO DE SERVICIOS DE ENFERMERÍA

Entre ${application.job_offer.company.full_name} y ${application.nurse.full_name}

1. DATOS DEL SERVICIO
   Fecha: ${application.job_offer.shift_date}
   Horario: ${application.job_offer.shift_start} - ${application.job_offer.shift_end}
   Lugar: ${application.job_offer.location}
   Tarifa: €${application.job_offer.rate}/hora

2. DATOS DEL PROFESIONAL
   Nombre: ${application.nurse.full_name}
   Nº Colegiado: ${application.nurse.nurse_profile.license_number}

3. TÉRMINOS Y CONDICIONES
   - El profesional se compromete a prestar servicios de enfermería en la fecha y horario acordados.
   - La tarifa acordada se abonará al finalizar el servicio.
   - El profesional debe presentarse con el uniforme y material necesario.
   - Ambas partes se comprometen a mantener la confidencialidad.

Firmado en _____________, a ___ de __________ de ____

_____________________    _____________________
Firma del Contratante    Firma del Profesional
      `;

      const blob = new Blob([contractText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${application.nurse.full_name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error al generar el contrato');
    }
  };

  const getRateColor = (rate: number) => {
    if (rate < 20) return 'text-red-600';
    if (rate < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-blue-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Ofertas de Trabajo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Publicar Nueva Oferta</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar ofertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-primary"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abierta</option>
              <option value="filled">Cubierta</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Valorar Desempeño del Enfermero</h3>
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valoración (1-5 estrellas)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingFormData(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${
                        star <= ratingFormData.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario
                </label>
                <textarea
                  value={ratingFormData.comment}
                  onChange={(e) => setRatingFormData(prev => ({ ...prev, comment: e.target.value }))}
                  className="input-primary h-32"
                  placeholder="Por favor, proporciona un comentario detallado sobre el desempeño del enfermero..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="btn-primary flex items-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    'Enviar Valoración'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Posting Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Nueva Oferta de Trabajo</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Trabajo
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-primary"
                  placeholder="ej., Se necesita Enfermero/a UCI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-primary"
                  placeholder="ej., Madrid, Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarifa por Hora (€)
                </label>
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                  className="input-primary"
                  min="0"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="input-primary"
                  placeholder="ej., UCI, Urgencias, Pediatría"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Turno
                </label>
                <input
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  className="input-primary"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.shift_start}
                    onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={formData.shift_end}
                    onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                    className="input-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-primary h-32"
                placeholder="Describe los requisitos y responsabilidades del trabajo..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  'Crear Oferta de Trabajo'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job Listings */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ofertas de trabajo</h3>
            <p className="mt-1 text-sm text-gray-500">
               {filteredJobs.length === 0 ? jobs.length === 0 ? 'Empieza creando una nueva oferta de trabajo.' : 'Ajusta los filtros de búsqueda.' : ''}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Job Card Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                      <Building size={16} />
                      <span>{job.company.role === 'individual' ? 'Particular' : job.company.full_name}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full font-medium ${getRateColor(job.rate)}`}>
                    €{job.rate}/h
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">
                      {new Date(job.shift_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span className="text-sm">{job.shift_start} - {job.shift_end}</span>
                  </div>
                </div>

                {/* Tags and Apply Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.specialty && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {job.specialty}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                      job.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'filled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status === 'open' ? 'Abierta' : job.status === 'filled' ? 'Cubierta' : 'Cancelada'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedJob === job.id ? 'Ocultar Solicitudes' : 'Ver Solicitudes'}
                  </button>
                </div>

                {/* Applications List */}
                {selectedJob === job.id && (
                  <div className="border-t pt-4 space-y-4">
                    {job.applications.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No hay solicitudes todavía</p>
                    ) : (
                      <>
                        {/* Show first 5 applications for free */}
                        {job.applications.slice(0, 5).map((application) => (
                          <NurseApplicationCard
                            key={application.id}
                            application={application}
                            onStatusChange={handleApplicationStatus}
                            onRating={() => setShowRatingForm({
                              jobId: job.id,
                              nurseId: application.nurse.id
                            })}
                            privateNote={privateNotes[application.nurse.id]}
                            onNoteUpdate={(note) => handleNoteUpdate(application.nurse.id, note)}
                            isEditingNote={editingNote === application.nurse.id}
                            onEditNote={() => setEditingNote(application.nurse.id)}
                            companyRole={companyRole}
                            onGenerateContract={() => generateContract(application)}
                            rating={job.rating}
                          />
                        ))}

                        {/* Premium section for remaining applications */}
                        {job.applications.length > 5 && !showingAllNurses && !isPremium && (
                          <div className="bg-gradient-to-b from-transparent to-white p-6 text-center">
                            <Lock className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {job.applications.length - 5} candidatas más disponibles
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Actualiza a premium para ver todas las candidatas
                            </p>
                            <button
                              onClick={() => setShowingAllNurses(true)}
                              className="btn-primary"
                            >
                              Ver todas las candidatas
                            </button>
                          </div>
                        )}

                        {/* Show remaining applications for premium users */}
                        {(showingAllNurses || isPremium) && job.applications.slice(5).map((application) => (
                          <NurseApplicationCard
                            key={application.id}
                            application={application}
                            onStatusChange={handleApplicationStatus}
                            onRating={() => setShowRatingForm({
                              jobId: job.id,
                              nurseId: application.nurse.id
                            })}
                            privateNote={privateNotes[application.nurse.id]}
                            onNoteUpdate={(note) => handleNoteUpdate(application.nurse.id, note)}
                            isEditingNote={editingNote === application.nurse.id}
                            onEditNote={() => setEditingNote(application.nurse.id)}
                            companyRole={companyRole}
                            onGenerateContract={() => generateContract(application)}
                            rating={job.rating}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
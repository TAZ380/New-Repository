import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  Star,
  Building,
  AlertCircle,
  Loader2,
  ChevronRight,
  BadgeEuro,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  rate: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  specialty: string;
  status: 'open' | 'filled' | 'cancelled';
  company: {
    id: string;
    full_name: string;
    role: 'company' | 'individual';
  };
  contract_required: boolean;
  contract_url?: string;
  distance?: number;
}

const specialties = [
  'UCI',
  'Urgencias',
  'Pediatría',
  'Geriatría',
  'Salud Mental',
  'Quirófano',
  'Oncología',
  'Maternidad'
];

const shifts = [
  { id: 'morning', label: 'Mañana (7:00 - 15:00)' },
  { id: 'afternoon', label: 'Tarde (15:00 - 23:00)' },
  { id: 'night', label: 'Noche (23:00 - 7:00)' },
  { id: 'day12', label: '12h Diurno' },
  { id: 'night12', label: '12h Nocturno' },
  { id: 'special', label: 'Horario Especial' }
];

export function JobListings() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [canApply, setCanApply] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    specialty: '',
    shift: '',
    minRate: 0,
    maxRate: 1000,
    maxDistance: 50 // km
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkDocumentStatus();
    getUserLocation();
    loadJobs();
  }, []);

  const checkDocumentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: documents, error: documentsError } = await supabase
        .from('user_documents')
        .select('status')
        .eq('user_id', user.id);

      if (documentsError) throw documentsError;

      setCanApply(documents?.every(doc => doc.status === 'approved') ?? false);
    } catch (err) {
      console.error('Error checking document status:', err);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('No se pudo obtener tu ubicación. Los resultados no estarán ordenados por proximidad.');
        }
      );
    }
  };

  const loadJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_offers')
        .select(`
          *,
          company:profiles(id, full_name, role)
        `)
        .eq('status', 'open')
        .gt('shift_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      let processedJobs = jobsData || [];

      // Calculate distances if user location is available
      if (userLocation) {
        processedJobs = processedJobs.map(job => ({
          ...job,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            job.coordinates.lat,
            job.coordinates.lng
          )
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setJobs(processedJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  const getRateColor = (rate: number) => {
    if (rate < 20) return 'text-red-600 bg-red-50';
    if (rate < 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getShiftType = (start: string, end: string): string => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    const duration = endHour > startHour ? 
      endHour - startHour : 
      24 - startHour + endHour;

    if (duration === 12) {
      return startHour >= 20 || startHour <= 8 ? '12h Nocturno' : '12h Diurno';
    }

    if (startHour >= 6 && startHour < 14) return 'Mañana';
    if (startHour >= 14 && startHour < 22) return 'Tarde';
    return 'Noche';
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = !filters.specialty || job.specialty === filters.specialty;
    const matchesRate = job.rate >= filters.minRate && job.rate <= filters.maxRate;
    const matchesDistance = !userLocation || !job.distance || job.distance <= filters.maxDistance;
    const matchesShift = !filters.shift || getShiftType(job.shift_start, job.shift_end) === filters.shift;

    return matchesSearch && matchesSpecialty && matchesRate && matchesDistance && matchesShift;
  });

  const handleApply = async (jobId: string) => {
    if (!canApply) {
      setError('Necesitas verificar tu documentación antes de poder aplicar a ofertas.');
      return;
    }

    try {
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert([{ job_id: jobId }]);

      if (applicationError) throw applicationError;

      // Refresh job list
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar al trabajo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar ofertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <select
                value={filters.specialty}
                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 px-3"
              >
                <option value="">Todas las especialidades</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Shifts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno
              </label>
              <select
                value={filters.shift}
                onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 px-3"
              >
                <option value="">Todos los turnos</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango Salarial (€/hora)
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.minRate || ''}
                  onChange={(e) => setFilters({ ...filters, minRate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.maxRate || ''}
                  onChange={(e) => setFilters({ ...filters, maxRate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3"
                />
              </div>
            </div>

            {/* Distance */}
            {userLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distancia máxima: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!canApply && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Necesitas verificar tu documentación antes de poder aplicar a ofertas.</span>
        </div>
      )}

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ofertas disponibles</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron ofertas que coincidan con tus criterios de búsqueda.
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
                    <span className="text-sm">
                      {job.location}
                      {job.distance && ` (${job.distance} km)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">
                      {new Date(job.shift_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span className="text-sm">
                      {getShiftType(job.shift_start, job.shift_end) === 'special' ? (
                        <span className="text-purple-600 font-medium">Horario Especial</span>
                      ) : (
                        `${job.shift_start} - ${job.shift_end}`
                      )}
                    </span>
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
                    {job.contract_required && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Requiere contrato
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                  >
                    Ver detalles
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedJob.title}</h2>
              
              <div className="space-y-6">
                {/* Company Info */}
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedJob.company.role === 'individual' ? 'Particular' : selectedJob.company.full_name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{selectedJob.location}</p>
                  </div>
                </div>

                {/* Salary Info */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <BadgeEuro className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Salario</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      €{selectedJob.rate}/hora (BRUTO)
                    </p>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horario</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {new Date(selectedJob.shift_date).toLocaleDateString()} <br />
                      {selectedJob.shift_start} - {selectedJob.shift_end}
                      {getShiftType(selectedJob.shift_start, selectedJob.shift_end) === 'special' && (
                        <span className="ml-2 text-purple-600 font-medium">(Horario Especial)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Descripción del trabajo</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedJob.description}</p>
                </div>

                {/* Contract Info */}
                {selectedJob.contract_required && (
                  <div className="border-t pt-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-2">Contrato Requerido</h3>
                      <p className="text-purple-700 text-sm">
                        Este trabajo requiere la firma de un contrato. Puedes revisarlo antes de aplicar.
                      </p>
                      {selectedJob.contract_url && (
                        <a
                          href={selectedJob.contract_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-800 font-medium mt-2"
                        >
                          Ver contrato
                          <ChevronRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 border-t pt-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleApply(selectedJob.id)}
                    disabled={!canApply}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aplicar al turno
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
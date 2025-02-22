import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Briefcase, 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  Users,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  company: {
    full_name: string;
  };
}

interface Application {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  job_offer: JobOffer;
  created_at: string;
}

interface NurseProfile {
  license_number: string;
  specialties: string[];
  years_experience: number;
  availability: {
    weekdays: boolean;
    weekends: boolean;
    nights: boolean;
  };
}

export function NurseDashboard() {
  const [profile, setProfile] = useState<NurseProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Load nurse profile
      const { data: profileData, error: profileError } = await supabase
        .from('nurse_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load available jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_offers')
        .select(`
          *,
          company:profiles(full_name)
        `)
        .eq('status', 'open')
        .gt('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true });

      if (jobsError) throw jobsError;
      setAvailableJobs(jobsData || []);

      // Load nurse's applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_offer:job_offers(
            id,
            title,
            location,
            rate,
            shift_date,
            shift_start,
            shift_end,
            specialty,
            status,
            company:profiles(full_name)
          )
        `)
        .eq('nurse_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      setApplying(jobId);
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert([
          { job_id: jobId }
        ]);

      if (applicationError) throw applicationError;

      // Refresh data
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for job');
    } finally {
      setApplying(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRateColor = (rate: number) => {
    if (rate < 20) return 'text-red-600';
    if (rate < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Briefcase size={20} />
              <span className="font-semibold">Experience</span>
            </div>
            <p className="text-gray-700">{profile?.years_experience} years</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Calendar size={20} />
              <span className="font-semibold">Availability</span>
            </div>
            <div className="space-y-1">
              {Object.entries(profile?.availability || {}).map(([day, available]) => (
                available && (
                  <span key={day} className="inline-block bg-green-100 text-green-800 rounded px-2 py-1 text-sm mr-2">
                    {day}
                  </span>
                )
              ))}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-700 mb-2">
              <Users size={20} />
              <span className="font-semibold">Specialties</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.specialties.map((specialty) => (
                <span key={specialty} className="bg-purple-100 text-purple-800 rounded px-2 py-1 text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Your Applications */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Applications</h2>
        <div className="space-y-4">
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">You haven't applied to any jobs yet.</p>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.job_offer.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {application.job_offer.company.full_name}
                    </p>
                  </div>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="text-sm">{application.job_offer.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">
                      {new Date(application.job_offer.shift_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span className="text-sm">
                      {application.job_offer.shift_start} - {application.job_offer.shift_end}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} />
                    <span className="text-sm">€{application.job_offer.rate}/hr</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Jobs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Jobs</h2>
        <div className="space-y-6">
          {availableJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No matching jobs available at the moment.</p>
          ) : (
            availableJobs.map((job) => {
              const hasApplied = applications.some(app => app.job_offer.id === job.id);
              
              return (
                <div key={job.id} className="border rounded-lg p-6 hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company.full_name}</p>
                    </div>
                    <span className={`font-semibold ${getRateColor(job.rate)}`}>
                      €{job.rate}/hr
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">{new Date(job.shift_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      <span className="text-sm">{job.shift_start} - {job.shift_end}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {job.specialty && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {job.specialty}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={hasApplied || applying === job.id}
                      className={`btn-primary flex items-center gap-2 ${
                        hasApplied ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {applying === job.id ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : hasApplied ? (
                        <>
                          <CheckCircle size={20} />
                          <span>Applied</span>
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
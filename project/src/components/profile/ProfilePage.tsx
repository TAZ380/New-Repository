import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  DollarSign,
  FileText,
  Crown,
  GraduationCap,
  AlertCircle,
  Loader2,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PersonalInfo } from './PersonalInfo';
import { PremiumCard } from './PremiumCard';
import { BillingHistory } from './BillingHistory';

interface UserProfile {
  id: string;
  role: 'nurse' | 'company' | 'individual';
  full_name: string;
  email: string;
  phone: string;
  location: string;
  verified: boolean;
  subscription_status: 'free' | 'premium';
  subscription_end_date?: string;
  linkedin_url?: string;
  avatar_url?: string;
  license_number?: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  invoice_url?: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First get the basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // If user is a nurse, try to get their license number
      let licenseNumber: string | undefined;
      if (profileData.role === 'nurse') {
        try {
          const { data: nurseData } = await supabase
            .from('nurse_profiles')
            .select('license_number')
            .eq('id', user.id)
            .maybeSingle();

          if (nurseData) {
            licenseNumber = nurseData.license_number;
          }
        } catch (nurseError) {
          console.warn('Could not load nurse profile:', nurseError);
        }
      }

      // Load payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setProfile({
        ...profileData,
        license_number: licenseNumber
      });
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { error: cancelError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          subscription_end_date: null
        })
        .eq('id', profile?.id);

      if (cancelError) throw cancelError;

      await loadProfile();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Error al cancelar la suscripción');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>No se ha encontrado el perfil. Por favor, inicia sesión de nuevo.</span>
        </div>
      </div>
    );
  }

  // Feature cards configuration with pastel colors
  const cards = [
    // Row 1: Ganancias
    {
      title: 'Ganancias',
      description: 'Gestiona tus ingresos y pagos',
      icon: <DollarSign className="h-6 w-6 text-emerald-700" />,
      path: '/earnings',
      bgColor: 'bg-[#C8E6C9]',
      hoverBgColor: 'hover:bg-[#B7DDB9]',
      textColor: 'text-emerald-800',
      iconBgColor: 'bg-emerald-100',
      fullWidth: true
    },
    // Row 2: Historial de Contratos y Formación
    {
      title: 'Historial de Contratos',
      description: 'Revisa tus contratos y valoraciones',
      icon: <FileText className="h-6 w-6 text-blue-700" />,
      path: '/contracts',
      bgColor: 'bg-[#D7E3FC]',
      hoverBgColor: 'hover:bg-[#C6D6F9]',
      textColor: 'text-blue-800',
      iconBgColor: 'bg-blue-100'
    },
    {
      title: 'Formación y Cursos',
      description: 'Mejora tus habilidades profesionales',
      icon: <GraduationCap className="h-6 w-6 text-purple-700" />,
      path: '/courses',
      bgColor: 'bg-[#E1CFEA]',
      hoverBgColor: 'hover:bg-[#D4BEE1]',
      textColor: 'text-purple-800',
      iconBgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Personal Information Section */}
      <PersonalInfo profile={profile} onUpdate={loadProfile} />

      {/* Premium Section */}
      <div className="space-y-6">
        <PremiumCard
          subscriptionStatus={profile.subscription_status}
          subscriptionEndDate={profile.subscription_end_date}
          onManageSubscription={() => {
            if (profile.subscription_status === 'premium') {
              setShowCancelConfirm(true);
            } else {
              navigate('/subscription');
            }
          }}
        />

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Historial de Facturación</h3>
          </div>
          <BillingHistory payments={payments} />
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className={`
              ${card.bgColor} ${card.hoverBgColor} ${card.textColor}
              transition-all rounded-xl overflow-hidden shadow-md hover:shadow-lg
              ${card.fullWidth ? 'md:col-span-2' : ''}
              group
            `}
          >
            <div className="p-6 flex items-center gap-4">
              <div className={`${card.iconBgColor} rounded-lg p-3`}>
                {card.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{card.title}</h3>
                <p className="text-sm opacity-90 mt-1">{card.description}</p>
              </div>
              <ChevronRight className={`h-5 w-5 ${card.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          </button>
        ))}
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancelar Suscripción Premium
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres cancelar tu suscripción Premium? 
              Mantendrás los beneficios hasta el {format(new Date(profile.subscription_end_date!), "d 'de' MMMM, yyyy", { locale: es })}.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
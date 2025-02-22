import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Loader2,
  Building,
  Clock,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contract {
  id: string;
  company: {
    full_name: string;
  };
  shift_date: string;
  shift_type: string;
  shift_start: string;
  shift_end: string;
  payment_amount: number;
  payment_status: string;
  payment_date: string;
}

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  averagePerShift: number;
  totalShifts: number;
  paidShifts: number;
  pendingPayments: number;
}

export function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    averagePerShift: 0,
    totalShifts: 0,
    paidShifts: 0,
    pendingPayments: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id,
          company:profiles!contracts_company_id_fkey(full_name),
          shift_date,
          shift_type,
          shift_start,
          shift_end,
          payment_amount,
          payment_status,
          payment_date
        `)
        .eq('nurse_id', user.id)
        .eq('status', 'completed')
        .order('shift_date', { ascending: false });

      if (contractsError) throw contractsError;
      
      setContracts(contractsData || []);
      calculateStats(contractsData || []);
    } catch (err) {
      console.error('Error loading earnings data:', err);
      setError('Error al cargar los datos de ganancias');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contractsData: Contract[]) => {
    const totalEarnings = contractsData.reduce((sum, contract) => 
      sum + (contract.payment_status === 'paid' ? contract.payment_amount : 0), 0);

    const currentMonth = new Date();
    const monthlyContracts = contractsData.filter(contract => {
      const contractDate = new Date(contract.shift_date);
      return contractDate.getMonth() === currentMonth.getMonth() &&
             contractDate.getFullYear() === currentMonth.getFullYear() &&
             contract.payment_status === 'paid';
    });

    const monthlyEarnings = monthlyContracts.reduce((sum, contract) => 
      sum + contract.payment_amount, 0);

    const paidContracts = contractsData.filter(c => c.payment_status === 'paid');
    const averagePerShift = paidContracts.length > 0 
      ? totalEarnings / paidContracts.length 
      : 0;

    setStats({
      totalEarnings,
      monthlyEarnings,
      averagePerShift,
      totalShifts: contractsData.length,
      paidShifts: paidContracts.length,
      pendingPayments: contractsData.filter(c => c.payment_status === 'pending').length
    });
  };

  const filterContractsByPeriod = (period: string) => {
    setSelectedPeriod(period);
    let filteredContracts = [...contracts];

    if (period !== 'all') {
      const today = new Date();
      let startDate;

      switch (period) {
        case 'month':
          startDate = startOfMonth(today);
          break;
        case '3months':
          startDate = startOfMonth(subMonths(today, 2));
          break;
        case '6months':
          startDate = startOfMonth(subMonths(today, 5));
          break;
        default:
          startDate = today;
      }

      filteredContracts = contracts.filter(contract => 
        new Date(contract.shift_date) >= startDate &&
        new Date(contract.shift_date) <= endOfMonth(today)
      );
    }

    calculateStats(filteredContracts);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Ganado</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalEarnings.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR'
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Desde que empezaste en la plataforma
          </p>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Este Mes</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.monthlyEarnings.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR'
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {format(new Date(), 'MMMM yyyy', { locale: es })}
          </p>
        </div>

        {/* Average per Shift */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Media por Turno</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.averagePerShift.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Basado en {stats.paidShifts} turnos completados
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => filterContractsByPeriod('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => filterContractsByPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => filterContractsByPeriod('3months')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === '3months'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 3 Meses
          </button>
          <button
            onClick={() => filterContractsByPeriod('6months')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === '6months'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 6 Meses
          </button>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Historial de Pagos</h2>
        </div>

        {contracts.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay contratos completados</h3>
            <p className="text-gray-500 mt-2">
              Aún no has completado ningún turno a través de la plataforma.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">
                        {contract.company.full_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(contract.shift_date), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {contract.shift_start} - {contract.shift_end}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {contract.payment_amount.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                      contract.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                    {contract.payment_status === 'paid' && contract.payment_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Pagado el {format(new Date(contract.payment_date), "d 'de' MMMM", { locale: es })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
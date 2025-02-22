import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Building,
  Calendar,
  Clock,
  Star,
  Download,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contract {
  id: string;
  nurse_id: string;
  company_id: string;
  company: {
    full_name: string;
  };
  shift_date: string;
  shift_type: string;
  shift_start: string;
  shift_end: string;
  rate: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  nurse_rating?: number;
  nurse_review?: string;
  company_rating?: number;
  company_review?: string;
  nurse_notes?: string;
  company_notes?: string;
  created_at: string;
  contract_url?: string;
}

export function ContractHistory() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    review: ''
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          company:profiles!contracts_company_id_fkey(full_name)
        `)
        .eq('nurse_id', user.id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      setContracts(contractsData || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedContract) return;

    try {
      const { error: reviewError } = await supabase
        .from('contracts')
        .update({
          nurse_rating: reviewData.rating,
          nurse_review: reviewData.review
        })
        .eq('id', selectedContract.id);

      if (reviewError) throw reviewError;

      await loadContracts();
      setShowReviewForm(false);
      setReviewData({ rating: 5, review: '' });
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Error al enviar la valoración');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
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
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay contratos</h3>
            <p className="text-gray-500 mt-2">
              Aún no has realizado ningún contrato a través de la plataforma.
            </p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Contract Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.company.full_name}
                      </h3>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-2 ${getStatusColor(contract.status)}`}>
                      {getStatusText(contract.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      €{contract.rate}/h
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(contract.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  </div>
                </div>

                {/* Contract Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">
                      {format(new Date(contract.shift_date), "d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">
                      {contract.shift_start} - {contract.shift_end}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">{contract.shift_type}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  {contract.contract_url && (
                    <button
                      onClick={() => window.open(contract.contract_url, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>Descargar Contrato</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedContract(contract);
                      setShowReviewForm(!contract.nurse_rating);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Star className="h-5 w-5" />
                    <span>
                      {contract.nurse_rating ? 'Ver Valoración' : 'Valorar'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedContract && (showReviewForm || selectedContract.nurse_rating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {showReviewForm ? 'Valorar Contrato' : 'Detalles de Valoración'}
              </h3>
              <button
                onClick={() => {
                  setSelectedContract(null);
                  setShowReviewForm(false);
                  setReviewData({ rating: 5, review: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showReviewForm ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valoración
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className={`text-2xl ${
                          star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
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
                    value={reviewData.review}
                    onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Comparte tu experiencia..."
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setSelectedContract(null);
                      setShowReviewForm(false);
                      setReviewData({ rating: 5, review: '' });
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enviar Valoración
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Nurse Review */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tu Valoración</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-2xl">
                          {star <= (selectedContract.nurse_rating || 0) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600">{selectedContract.nurse_review}</p>
                  </div>
                </div>

                {/* Company Review */}
                {selectedContract.company_rating && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Valoración de {selectedContract.company.full_name}
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-2xl">
                            {star <= selectedContract.company_rating! ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-600">{selectedContract.company_review}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedContract(null);
                    setShowReviewForm(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
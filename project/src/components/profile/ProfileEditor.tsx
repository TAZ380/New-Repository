import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, AlertCircle, Loader2, CheckCircle, Globe, CreditCard, X, ChevronLeft, Ban as Bank, Phone } from 'lucide-react';
import { ImagePicker } from './ImagePicker';
import { supabase } from '../../lib/supabase';

const AVAILABLE_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'Inglés' },
  { code: 'fr', name: 'Francés' },
  { code: 'de', name: 'Alemán' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Portugués' },
  { code: 'ca', name: 'Catalán' },
  { code: 'eu', name: 'Euskera' },
  { code: 'gl', name: 'Gallego' },
  { code: 'other', name: 'Otros' }
];

const PAYMENT_METHODS = [
  { id: 'bank_account', name: 'Cuenta Bancaria', icon: Bank },
  { id: 'paypal', name: 'PayPal', icon: CreditCard },
  { id: 'bizum', name: 'Bizum', icon: Phone }
];

export function ProfileEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    newEmail: '',
    license_number: '',
    languages: [] as string[],
    nativeLanguage: '',
    avatar_url: '',
    payment_methods: [] as {
      type: string;
      verified: boolean;
      data: Record<string, string>;
    }[]
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // If user is a nurse, get their license number
      let licenseNumber = '';
      if (profile.role === 'nurse') {
        const { data: nurseData } = await supabase
          .from('nurse_profiles')
          .select('license_number')
          .eq('id', user.id)
          .maybeSingle();

        if (nurseData) {
          licenseNumber = nurseData.license_number;
        }
      }

      setFormData({
        ...formData,
        ...profile,
        license_number: licenseNumber
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          languages: formData.languages,
          payment_methods: formData.payment_methods,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If license number changed and user is a nurse, verify against uploaded document
      if (formData.license_number) {
        const { data: documents } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_type', 'colegiado')
          .eq('status', 'approved')
          .maybeSingle();

        // If document exists and is approved, update nurse profile
        if (documents) {
          const { error: nurseError } = await supabase
            .from('nurse_profiles')
            .update({
              license_number: formData.license_number,
              license_number_verified: true
            })
            .eq('id', user.id);

          if (nurseError) throw nurseError;
        }
      }

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    try {
      setError('');
      
      const { error: emailError } = await supabase.auth.updateUser({
        email: formData.newEmail
      });

      if (emailError) throw emailError;

      setShowEmailChange(false);
      setSuccess('Se ha enviado un correo de confirmación');
      setFormData({ ...formData, newEmail: '' });
    } catch (err) {
      console.error('Error updating email:', err);
      setError('Error al actualizar el email');
    }
  };

  const validatePaymentMethod = (type: string, data: Record<string, string>): boolean => {
    switch (type) {
      case 'bank_account':
        return /^ES\d{22}$/.test(data.iban);
      case 'paypal':
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email);
      case 'bizum':
        return /^\+34\d{9}$/.test(data.phone);
      default:
        return false;
    }
  };

  const handlePaymentMethodAdd = (type: string, data: Record<string, string>) => {
    if (!validatePaymentMethod(type, data)) {
      setError('Datos de pago inválidos');
      return;
    }

    setFormData({
      ...formData,
      payment_methods: [
        ...formData.payment_methods,
        { type, verified: false, data }
      ]
    });
    setShowPaymentMethodForm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Volver</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {error ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span>{error || success}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        {/* Profile Image */}
        <div className="flex justify-center">
          <ImagePicker
            currentImageUrl={formData.avatar_url}
            onImageChange={(url) => setFormData({ ...formData, avatar_url: url })}
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tu nombre completo"
          />
        </div>

        {/* License Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Colegiado
          </label>
          <input
            type="text"
            value={formData.license_number}
            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Número de colegiado"
          />
          <p className="mt-1 text-sm text-gray-500">
            Se verificará automáticamente con tu carnet de colegiado
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="flex items-center gap-4">
            <input
              type="email"
              value={formData.email}
              readOnly
              className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-gray-600"
            />
            <button
              onClick={() => setShowEmailChange(true)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* Email Change Form */}
        {showEmailChange && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <input
                type="email"
                value={formData.newEmail}
                onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nuevo email"
              />
              <button
                onClick={handleEmailChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
            <p className="mt-2 text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Se enviará un correo de confirmación
            </p>
          </div>
        )}

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idiomas
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
              >
                {lang.startsWith('custom:') ? lang.replace('custom:', '') : 
                  AVAILABLE_LANGUAGES.find(l => l.code === lang)?.name}
                <button
                  onClick={() => setFormData({
                    ...formData,
                    languages: formData.languages.filter(l => l !== lang)
                  })}
                  className="hover:text-blue-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setShowLanguageSelector(true)}
              className="px-3 py-1 border border-dashed border-gray-300 text-gray-600 rounded-full text-sm hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              Añadir idioma
            </button>
          </div>
        </div>

        {/* Language Selector Modal */}
        {showLanguageSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Seleccionar Idioma</h3>
              <div className="space-y-4">
                {/* Predefined Languages */}
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_LANGUAGES
                    .filter(lang => !formData.languages.includes(lang.code) && lang.code !== 'other')
                    .map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            languages: [...formData.languages, lang.code]
                          });
                          setShowLanguageSelector(false);
                        }}
                        className="p-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {lang.name}
                      </button>
                    ))}
                </div>

                {/* Custom Language Input */}
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Otro idioma
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe el nombre del idioma"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            setFormData({
                              ...formData,
                              languages: [...formData.languages, `custom:${value}`]
                            });
                            setShowLanguageSelector(false);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => setShowLanguageSelector(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Presiona Enter para añadir el idioma
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Dónde debe ingresarse tu dinero?
          </label>
          <div className="space-y-4">
            {formData.payment_methods.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {PAYMENT_METHODS.find(m => m.id === method.type)?.icon({
                    className: 'h-5 w-5 text-gray-600'
                  })}
                  <div>
                    <span className="font-medium">
                      {PAYMENT_METHODS.find(m => m.id === method.type)?.name}
                    </span>
                    <div className="text-sm text-gray-500">
                      {method.type === 'bank_account' && `****${method.data.iban.slice(-4)}`}
                      {method.type === 'paypal' && method.data.email}
                      {method.type === 'bizum' && method.data.phone}
                    </div>
                  </div>
                </div>
                {method.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <span className="text-sm text-yellow-600">Pendiente de verificación</span>
                )}
              </div>
            ))}

            {/* Add Payment Method Button */}
            <button
              onClick={() => setShowPaymentMethodForm('bank_account')}
              className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>Añadir medio para transferencia de dinero</span>
            </button>
          </div>
        </div>

        {/* Payment Method Form Modal */}
        {showPaymentMethodForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Añadir Método de Pago</h3>
              
              {/* Payment Method Selector */}
              <div className="space-y-4">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setShowPaymentMethodForm(method.id)}
                    className={`w-full p-4 flex items-center gap-3 rounded-lg transition-colors ${
                      showPaymentMethodForm === method.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <method.icon className="h-5 w-5" />
                    <span className="font-medium">{method.name}</span>
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="mt-6 space-y-4">
                {showPaymentMethodForm === 'bank_account' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN
                    </label>
                    <input
                      type="text"
                      placeholder="ES91 2100 0418 4502 0005 1332"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '').toUpperCase();
                        if (/^[A-Z0-9]*$/.test(value)) {
                          handlePaymentMethodAdd('bank_account', { iban: value });
                        }
                      }}
                    />
                  </div>
                )}

                {showPaymentMethodForm === 'paypal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de PayPal
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => handlePaymentMethodAdd('paypal', { email: e.target.value })}
                    />
                  </div>
                )}

                {showPaymentMethodForm === 'bizum' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="+34 600 000 000"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        if (/^\+?\d*$/.test(value)) {
                          handlePaymentMethodAdd('bizum', { phone: value });
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowPaymentMethodForm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowPaymentMethodForm(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
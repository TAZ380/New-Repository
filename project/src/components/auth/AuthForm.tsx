import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['nurse', 'company', 'individual']),
  terms: z.boolean().refine((val) => val === true, 'Debes aceptar los términos y condiciones')
});

const roleLabels = {
  nurse: 'Enfermero/a',
  company: 'Empresa',
  individual: 'Particular'
};

type AuthFormProps = {
  type: 'login' | 'register';
};

export function AuthForm({ type }: AuthFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'nurse' as const,
    terms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'register') {
        registerSchema.parse(formData);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                role: formData.role,
                verified: false
              }
            ]);

          if (profileError) throw profileError;
          
          navigate('/upload-documents');
        }
      } else {
        loginSchema.parse(formData);

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (!user) throw new Error('No se ha encontrado usuario');

        // Check profile and document status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          // Create profile if it doesn't exist (this can happen if the profile creation failed during registration)
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                role: 'nurse', // Default role, user can change this later
                verified: false
              }
            ]);

          if (createProfileError) throw createProfileError;
          navigate('/upload-documents');
          return;
        }

        // Check document status
        const { data: documents, error: documentsError } = await supabase
          .from('user_documents')
          .select('status')
          .eq('user_id', user.id);

        if (documentsError) throw documentsError;

        const hasIncompleteDocuments = !documents || documents.length === 0 || 
          documents.some(doc => doc.status !== 'approved');

        navigate(hasIncompleteDocuments ? '/upload-documents' : '/dashboard');
      }
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
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {type === 'login' ? 'Bienvenido/a a NurseJobs' : 'Únete a NurseJobs'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="appearance-none border rounded-lg w-full py-3 px-4 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="appearance-none border rounded-lg w-full py-3 px-4 pl-10 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        {type === 'register' && (
          <>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Soy:
              </label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(roleLabels).map(([role, label]) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Acepto los{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    términos y condiciones
                  </a>
                </span>
              </label>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Por favor, espere...' : type === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            {type === 'login' ? "¿No tienes una cuenta? " : '¿Ya tienes una cuenta? '}
            <button
              type="button"
              onClick={() => navigate(type === 'login' ? '/register' : '/login')}
              className="text-blue-600 hover:underline"
            >
              {type === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
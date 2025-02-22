import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Camera, Plus, Eye, UploadCloud as CloudUpload, FileCheck, Building, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Document {
  id: string;
  document_type: string;
  status: 'pending_review' | 'approved' | 'rejected';
  file_path: string;
  created_at: string;
  rejection_reason?: string;
}

interface DocumentType {
  type: string;
  name: string;
  description: string;
  formats: string;
  required: boolean;
  isPhoto?: boolean;
  category: 'identification' | 'education' | 'professional' | 'other';
  icon: React.ReactNode;
}

const documentTypes: Record<string, DocumentType[]> = {
  nurse: [
    {
      type: 'dni',
      name: 'DNI/NIE',
      description: 'Documento de identidad en vigor',
      formats: '.pdf,.jpg,.jpeg,.png',
      required: true,
      category: 'identification',
      icon: <FileCheck className="h-8 w-8 text-blue-600" />
    },
    {
      type: 'titulo',
      name: 'Título de Enfermería',
      description: 'Título universitario oficial',
      formats: '.pdf',
      required: true,
      category: 'education',
      icon: <FileText className="h-8 w-8 text-purple-600" />
    },
    {
      type: 'colegiado',
      name: 'Carnet de Colegiado',
      description: 'Foto del carnet de colegiado en vigor',
      formats: '.jpg,.jpeg,.png',
      required: true,
      isPhoto: true,
      category: 'professional',
      icon: <Camera className="h-8 w-8 text-green-600" />
    },
    {
      type: 'irpf',
      name: 'Modelo IRPF',
      description: 'Modelo 145 de IRPF',
      formats: '.pdf',
      required: true,
      category: 'other',
      icon: <FileText className="h-8 w-8 text-yellow-600" />
    }
  ]
};

const categoryColors = {
  identification: 'bg-blue-100 text-blue-600',
  education: 'bg-purple-100 text-purple-600',
  professional: 'bg-green-100 text-green-600',
  other: 'bg-yellow-100 text-yellow-600'
};

export function DocumentUpload() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserRole(profile.role);

      // Get user documents
      const { data: docs, error: docsError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id);

      if (docsError) throw docsError;
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    try {
      setUploading(type);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create or update document record
      const { error: docError } = await supabase
        .from('user_documents')
        .upsert([{
          user_id: user.id,
          document_type: type,
          file_path: fileName,
          status: 'pending_review'
        }]);

      if (docError) throw docError;

      await loadUserDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Error al subir el documento');
    } finally {
      setUploading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!userRole || !documentTypes[userRole]) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron requisitos de documentación para tu tipo de usuario.
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

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentTypes[userRole].map((docType) => {
          const existingDoc = documents.find(d => d.document_type === docType.type);

          return (
            <div
              key={docType.type}
              className={`
                relative border rounded-lg overflow-hidden transition-all
                ${existingDoc?.status === 'rejected' ? 'border-red-200' : 'border-gray-200'}
                ${uploading === docType.type ? 'opacity-75' : ''}
                hover:shadow-lg
              `}
            >
              {/* Upload Zone */}
              <label className="block cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept={docType.formats}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(docType.type, file);
                  }}
                  disabled={uploading === docType.type}
                />

                {/* Icon Area */}
                <div className={`
                  h-40 flex flex-col items-center justify-center gap-4
                  ${categoryColors[docType.category]}
                  ${existingDoc ? 'opacity-75' : ''}
                  transition-all group
                `}>
                  {docType.icon}
                  {!existingDoc && (
                    <CloudUpload className={`
                      h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity
                      ${categoryColors[docType.category]}
                    `} />
                  )}
                </div>

                {/* Document Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{docType.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                    </div>
                    {existingDoc && (
                      <div className={`
                        px-2 py-1 rounded-full flex items-center gap-1
                        ${getStatusColor(existingDoc.status)}
                      `}>
                        {getStatusIcon(existingDoc.status)}
                      </div>
                    )}
                  </div>

                  {/* Formats */}
                  <div className="text-xs text-gray-500 mt-2">
                    Formatos: {docType.formats.replace(/\./g, ' ').toUpperCase()}
                  </div>

                  {/* Rejection Reason */}
                  {existingDoc?.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <span className="font-medium">Motivo del rechazo:</span>{' '}
                      {existingDoc.rejection_reason}
                    </div>
                  )}

                  {/* Upload Status */}
                  {uploading === docType.type && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="text-sm text-gray-600">Subiendo...</span>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          );
        })}

        {/* Additional Documents Card */}
        <div className="border rounded-lg overflow-hidden transition-all hover:shadow-lg">
          <label className="block cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('other', file);
              }}
            />
            <div className="h-40 flex flex-col items-center justify-center gap-4 bg-gray-100 text-gray-600 group">
              <Plus className="h-12 w-12" />
              <span className="text-sm font-medium">Otros Documentos</span>
              <CloudUpload className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Sube documentación adicional que consideres relevante para tu perfil profesional
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
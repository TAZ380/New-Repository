import React, { useState, useEffect } from 'react';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Camera,
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Building,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Document {
  id: string;
  document_type: string;
  status: 'pending_review' | 'approved' | 'rejected';
  file_path: string;
  created_at: string;
  rejection_reason?: string;
  name?: string;
  description?: string;
  experience?: {
    position: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  };
}

interface DocumentType {
  type: string;
  name: string;
  description: string;
  formats: string;
  required: boolean;
  isPhoto?: boolean;
  category: 'identification' | 'education' | 'professional' | 'financial';
}

const documentTypes: Record<string, DocumentType[]> = {
  nurse: [
    {
      type: 'dni',
      name: 'DNI/NIE',
      description: 'Documento de identidad en vigor',
      formats: '.pdf,.jpg,.jpeg,.png',
      required: true,
      category: 'identification'
    },
    {
      type: 'titulo',
      name: 'Título de Enfermería',
      description: 'Título universitario oficial',
      formats: '.pdf',
      required: true,
      category: 'education'
    },
    {
      type: 'colegiado',
      name: 'Carnet de Colegiado',
      description: 'Foto del carnet de colegiado en vigor',
      formats: '.jpg,.jpeg,.png',
      required: true,
      isPhoto: true,
      category: 'professional'
    },
    {
      type: 'irpf',
      name: 'Modelo IRPF',
      description: 'Modelo 145 de IRPF',
      formats: '.pdf',
      required: true,
      category: 'financial'
    }
  ],
  company: [
    {
      type: 'cif',
      name: 'CIF',
      description: 'Número de Identificación Fiscal',
      formats: '.pdf',
      required: true,
      category: 'identification'
    },
    {
      type: 'registro_mercantil',
      name: 'Registro Mercantil',
      description: 'Certificado de inscripción en el Registro Mercantil',
      formats: '.pdf',
      required: true,
      category: 'professional'
    }
  ],
  individual: [
    {
      type: 'dni',
      name: 'DNI/NIE',
      description: 'Documento de identidad en vigor',
      formats: '.pdf,.jpg,.jpeg,.png',
      required: true,
      category: 'identification'
    },
    {
      type: 'domicilio',
      name: 'Comprobante de Domicilio',
      description: 'Factura reciente (luz, agua, etc.)',
      formats: '.pdf,.jpg,.jpeg,.png',
      required: true,
      category: 'identification'
    }
  ]
};

const categoryColors = {
  identification: 'bg-blue-100 text-blue-800',
  education: 'bg-purple-100 text-purple-800',
  professional: 'bg-green-100 text-green-800',
  financial: 'bg-yellow-100 text-yellow-800'
};

export function DocumentUpload() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addExperience: false,
    experience: {
      position: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false
    }
  });

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

  const handleFileUpload = async (file: File) => {
    if (!selectedDocument) return;

    try {
      setUploading(selectedDocument.type);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedDocument.type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create or update document record
      const { error: docError } = await supabase
        .from('user_documents')
        .upsert([{
          user_id: user.id,
          document_type: selectedDocument.type,
          file_path: fileName,
          status: 'pending_review',
          name: formData.name || file.name,
          description: formData.description,
          experience: formData.addExperience ? formData.experience : null
        }]);

      if (docError) throw docError;

      await loadUserDocuments();
      setShowUploadModal(false);
      resetForm();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Error al subir el documento');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      await loadUserDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al eliminar el documento');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      addExperience: false,
      experience: {
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        current: false
      }
    });
    setSelectedDocument(null);
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
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Verificado';
      case 'rejected':
        return 'Rechazado';
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

  if (!userRole || !documentTypes[userRole]) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron requisitos de documentación para tu tipo de usuario.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Documentación</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Añadir Documento</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const docType = documentTypes[userRole].find(t => t.type === doc.document_type);
          if (!docType) return null;

          return (
            <div
              key={doc.id}
              className={`
                border rounded-lg overflow-hidden transition-shadow hover:shadow-md
                ${doc.status === 'rejected' ? 'border-red-200' : 'border-gray-200'}
              `}
            >
              {/* Document Preview */}
              <div className={`h-32 flex items-center justify-center ${categoryColors[docType.category]}`}>
                {docType.isPhoto ? (
                  <Camera className="h-12 w-12" />
                ) : (
                  <FileText className="h-12 w-12" />
                )}
              </div>

              {/* Document Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {doc.name || docType.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${categoryColors[docType.category]}`}>
                      {docType.category.charAt(0).toUpperCase() + docType.category.slice(1)}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                    {getStatusIcon(doc.status)}
                    <span className="text-xs font-medium">{getStatusText(doc.status)}</span>
                  </div>
                </div>

                {doc.description && (
                  <p className="mt-2 text-sm text-gray-600">{doc.description}</p>
                )}

                {doc.experience && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{doc.experience.company}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(doc.experience.startDate).toLocaleDateString()} -{' '}
                        {doc.experience.current ? 'Actual' : new Date(doc.experience.endDate!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {doc.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                    <span className="font-medium">Motivo del rechazo:</span>{' '}
                    {doc.rejection_reason}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => window.open(doc.file_path, '_blank')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDocument(docType);
                      setShowUploadModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {selectedDocument ? 'Actualizar Documento' : 'Añadir Nuevo Documento'}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Document Type Selection */}
              {!selectedDocument && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentTypes[userRole].map((docType) => (
                      <button
                        key={docType.type}
                        type="button"
                        onClick={() => setSelectedDocument(docType)}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg border text-left
                          ${categoryColors[docType.category]} bg-opacity-10
                          hover:bg-opacity-20 transition-colors
                        `}
                      >
                        {docType.isPhoto ? (
                          <Camera className="h-6 w-6" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                        <div>
                          <span className="font-medium">{docType.name}</span>
                          <p className="text-sm mt-1">{docType.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload */}
              {selectedDocument && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Arrastra y suelta un archivo o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Formatos aceptados: {selectedDocument.formats}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept={selectedDocument.formats}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Document Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Documento
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Título Universitario 2020"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Añade una descripción o notas sobre el documento..."
                    />
                  </div>

                  {/* Experience Form */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.addExperience}
                        onChange={(e) => setFormData({ ...formData, addExperience: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Añadir experiencia laboral relacionada
                      </span>
                    </label>

                    {formData.addExperience && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Puesto
                          </label>
                          <input
                            type="text"
                            value={formData.experience.position}
                            onChange={(e) => setFormData({
                              ...formData,
                              experience: { ...formData.experience, position: e.target.value }
                            })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Enfermero/a UCI"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Centro/Empresa
                          </label>
                          <input
                            type="text"
                            value={formData.experience.company}
                            onChange={(e) => setFormData({
                              ...formData,
                              experience: { ...formData.experience, company: e.target.value }
                            })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Hospital Universitario"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fecha de Inicio
                            </label>
                            <input
                              type="date"
                              value={formData.experience.startDate}
                              onChange={(e) => setFormData({
                                ...formData,
                                experience: { ...formData.experience, startDate: e.target.value }
                              })}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fecha de Fin
                            </label>
                            <input
                              type="date"
                              value={formData.experience.endDate}
                              onChange={(e) => setFormData({
                                ...formData,
                                experience: { ...formData.experience, endDate: e.target.value }
                              })}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={formData.experience.current}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.experience.current}
                            onChange={(e) => setFormData({
                              ...formData,
                              experience: { ...formData.experience, current: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Trabajo actual
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
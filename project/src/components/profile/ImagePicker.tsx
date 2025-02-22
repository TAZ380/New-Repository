import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImagePickerProps {
  currentImageUrl?: string;
  size?: number;
  onImageChange: (url: string) => void;
}

export function ImagePicker({ currentImageUrl, size = 200, onImageChange }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona una imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor de 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <button
        onClick={handleImageClick}
        disabled={uploading}
        className="w-full h-full rounded-full overflow-hidden bg-gray-100 hover:bg-gray-200 transition-colors relative group"
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-8 w-8 text-white" />
        </div>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {error && (
        <div className="absolute -bottom-8 left-0 right-0 text-center text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
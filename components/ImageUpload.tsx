import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  onChange: (file: File | null) => void;
  previewUrl: string | null;
  error?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, onChange, previewUrl, error, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <span className="block text-sm font-medium text-gray-700 ml-1">{label}</span>}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full aspect-video rounded-2xl border-2 border-dashed 
          flex flex-col items-center justify-center cursor-pointer
          transition-all duration-200 group overflow-hidden bg-gray-50
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-900 hover:bg-white'}
          ${className}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
        />

        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white flex flex-col items-center">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs font-medium">Cambiar foto</span>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm text-gray-600 hover:text-red-500 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-center p-2 transition-transform duration-200 group-hover:scale-105">
            <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-1.5 text-brand-900 border border-gray-100">
              <ImageIcon className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-gray-500">Subir</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
    </div>
  );
};
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Plus, Image as ImageIcon } from 'lucide-react';

interface GalleryUploadProps {
    existingImages: string[];
    newFiles: File[];
    onUpdate: (existing: string[], files: File[]) => void;
    label?: string;
}

export const GalleryUpload: React.FC<GalleryUploadProps> = ({ existingImages, newFiles, onUpdate, label = "Galería de fotos" }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filePreviews, setFilePreviews] = useState<{ file: File, url: string }[]>([]);

    // Generate previews for new files
    useEffect(() => {
        const newPreviews = newFiles.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setFilePreviews(newPreviews);

        // Cleanup URLs on unmount or change
        return () => {
            newPreviews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [newFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const addedFiles = Array.from(e.target.files);
            // Combine with existing new files
            const updatedFiles = [...newFiles, ...addedFiles];
            onUpdate(existingImages, updatedFiles);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeExisting = (indexToRemove: number) => {
        const updatedExisting = existingImages.filter((_, idx) => idx !== indexToRemove);
        onUpdate(updatedExisting, newFiles);
    };

    const removeNewFile = (indexToRemove: number) => {
        const updatedFiles = newFiles.filter((_, idx) => idx !== indexToRemove);
        onUpdate(existingImages, updatedFiles);
    };

    const totalImages = existingImages.length + newFiles.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{totalImages} foto{totalImages !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {/* Submit New Button */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-900 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-brand-900"
                >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Agregar</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        multiple
                        className="hidden"
                    />
                </div>

                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                        <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeExisting(idx)}
                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-gray-600 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {/* New File Previews */}
                {filePreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-brand-200 ring-2 ring-brand-900/10">
                        <img src={preview.url} alt="Nueva foto" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-brand-900/10 pointer-events-none" />
                        <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-gray-600 hover:text-red-500 shadow-sm opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
            {totalImages === 0 && (
                <p className="text-[11px] text-gray-400 italic">
                    Agrega fotos adicionales para mostrar detalles de tu platillo.
                </p>
            )}
        </div>
    );
};

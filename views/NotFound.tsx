import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * 404 Not Found Page
 * Displayed when the user navigates to a non-existent route.
 */
const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-300">
                {/* 404 Icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <Search className="w-12 h-12 text-blue-500" />
                </div>

                {/* 404 Number */}
                <h1 className="text-6xl font-black text-brand-900 mb-2">
                    404
                </h1>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Página no encontrada
                </h2>

                {/* Description */}
                <p className="text-gray-500 mb-8">
                    La página que buscas no existe o ha sido movida.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver Atrás
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl font-semibold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
                    >
                        <Home className="w-4 h-4" />
                        Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;

import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { signIn } from '../services/auth';
import { useAppStore } from '../store/AppContext';

interface LoginProps {
  onNavigate: (view: AppView) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAppStore(); // Usamos el nuevo método login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await signIn(formData.email, formData.password);

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
             setError("Correo o contraseña incorrectos.");
        } else if (authError.message.includes("Email not confirmed")) {
             setError("Por favor confirma tu correo electrónico antes de iniciar sesión.");
        } else {
             setError(authError.message);
        }
      } else if (data?.user) {
        // Cargar datos del usuario
        login({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || 'Usuario'
        });
        
        // Ir directamente al dashboard
        onNavigate(AppView.DASHBOARD);
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-8 pb-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => onNavigate(AppView.LANDING)}
            className="p-2 -ml-2 text-gray-400 hover:text-brand-900 rounded-full hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="mt-6 space-y-2">
            <h2 className="text-3xl text-brand-900">Bienvenido de nuevo</h2>
            <p className="text-gray-500">Ingresa tus credenciales para ver tu negocio.</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium leading-tight">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div className="space-y-4">
            <Input 
              label="Correo electrónico" 
              name="email" 
              type="email" 
              placeholder="ejemplo@mesero.app"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="space-y-1">
              <Input 
                label="Contraseña" 
                name="password"
                type="password" 
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <div className="flex justify-end">
                <a href="#" className="text-xs font-medium text-accent-600 hover:text-accent-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button fullWidth isLoading={loading} type="submit" className="text-lg">
              Iniciar Sesión
            </Button>
          </div>
        </form>
        
        <div className="mt-auto pt-6 text-center">
             <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => onNavigate(AppView.REGISTER)} 
                className="font-semibold text-brand-900 hover:underline"
              >
                Regístrate
              </button>
            </p>
        </div>
      </div>
    </div>
  );
};

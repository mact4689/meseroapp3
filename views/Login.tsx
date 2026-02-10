import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { signIn, resetPassword } from '../services/auth';
import { useAppStore } from '../store/AppContext';

interface LoginProps {
  onNavigate: (view: AppView) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await resetPassword(formData.email);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage("Se ha enviado un enlace de recuperación a tu correo.");
        // Optional: clear email or keep it for user convenience
      }
    } catch (err) {
      setError("Error al enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
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
          name: data.user.user_metadata?.full_name || 'Usuario',
          role: 'owner' // Default for initial login payload, will be updated by profile fetch
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
            <h2 className="text-3xl text-brand-900">
              {isResettingPassword ? 'Recuperar Contraseña' : 'Bienvenido de nuevo'}
            </h2>
            <p className="text-gray-500">
              {isResettingPassword
                ? 'Te ayudaremos a recuperar el acceso a tu cuenta.'
                : 'Ingresa tus credenciales para ver tu negocio.'}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium leading-tight">{successMessage}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium leading-tight">{error}</p>
          </div>
        )}

        {/* Form */}
        {isResettingPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
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
            </div>
            <div className="pt-4 space-y-3">
              <Button fullWidth isLoading={loading} type="submit" className="text-lg">
                Enviar enlace
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-brand-900 transition-colors p-2"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-medium text-accent-600 hover:text-accent-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button fullWidth isLoading={loading} type="submit" className="text-lg">
                Iniciar Sesión
              </Button>
            </div>
          </form>
        )}

        {!isResettingPassword && (
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
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppView } from '../types';
import { ArrowLeft, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { signUp } from '../services/auth';
import { useAppStore } from '../store/AppContext';
import { upsertProfile } from '../services/db';
import { supabase } from '../services/client';

interface RegisterProps {
  onNavigate: (view: AppView) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAppStore(); // Usamos el nuevo método register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    acceptTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await signUp(
        formData.email,
        formData.password,
        { full_name: formData.fullName }
      );

      if (authError) {
        // Traducción de errores comunes de Supabase
        console.error("Supabase Auth Error:", authError);
        if (authError.message.includes("already registered") || authError.message.includes("User already exists")) {
          setError("Ya existe una cuenta registrada con esta información. Por favor inicia sesión.");
        } else if (authError.message.includes("Password") || authError.message.includes("weak")) {
          setError("La contraseña es muy débil. Usa al menos 6 caracteres.");
        } else if (authError.message.includes("valid email")) {
          setError("Por favor ingresa un correo electrónico válido.");
        } else {
          setError("Error al registrar: " + authError.message);
        }
      } else if (data?.user) {
        // SEGURIDAD: Si Supabase devuelve sesión (auto-login), la cerramos forzosamente
        // para obligar al usuario a verificar su correo primero.
        if (data.session) {
          await supabase.auth.signOut();
        }

        // Siempre mostramos el mensaje de verificación, independientemente de si hubo sesión o no.
        setError("Registro exitoso. Por favor revisa tu correo para confirmar tu cuenta y luego inicia sesión.");

        // Redirigimos al login después de 5 segundos
        setTimeout(() => onNavigate(AppView.LOGIN), 5000);
        return;

        // CRÍTICO: Crear perfil inicial en la base de datos inmediatamente
        // Esto previene el error 23503 (FK Violation) al crear items después
        const profileError = await upsertProfile(data.user!.id, {
          name: formData.fullName || 'Nuevo Usuario',
          cuisine: 'Variada', // Valor por defecto
          logo_url: null
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // No bloqueamos, pero advertimos en consola.
          // Si hay sesión, el intento de "addMenuItem" en AppContext intentará repararlo.
        }

        // Inicializar estado nuevo para este usuario
        register({
          id: data.user!.id,
          email: data.user!.email!,
          name: formData.fullName
        });

        // Ir a la bienvenida para iniciar el flujo de configuración
        onNavigate(AppView.WELCOME);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.");
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
            <h2 className="font-serif text-3xl text-brand-900">Crear cuenta</h2>
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
              label="Nombre completo"
              name="fullName"
              type="text"
              placeholder="Juan Pérez"
              icon={<User className="w-5 h-5" />}
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              placeholder="juan@ejemplo.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Crear una contraseña segura"
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-500 cursor-pointer">
                  Acepto los <a href="#" className="font-medium text-brand-900 hover:underline">Términos</a> y la <a href="#" className="font-medium text-brand-900 hover:underline">Política de Privacidad</a>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button fullWidth isLoading={loading} type="submit" className="text-lg">
              Registrarme
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-center text-gray-500 mb-6">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => onNavigate(AppView.LOGIN)}
              className="font-semibold text-brand-900 hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
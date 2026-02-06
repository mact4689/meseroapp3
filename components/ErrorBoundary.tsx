import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the errors, and displays a fallback UI instead of a white screen.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to console (in production, this could send to Sentry/LogRocket)
        console.error('🚨 ErrorBoundary caught an error:', error);
        console.error('Component Stack:', errorInfo.componentStack);

        this.setState({ errorInfo });

        // TODO: In production, send to error tracking service
        // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-300">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ¡Ups! Algo salió mal
                        </h1>

                        {/* Description */}
                        <p className="text-gray-500 mb-6">
                            Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
                        </p>

                        {/* Error details (dev only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-600 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl font-semibold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Recargar Página
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Ir al Inicio
                            </button>
                        </div>

                        {/* Support text */}
                        <p className="mt-6 text-xs text-gray-400">
                            Si el problema persiste, contacta a soporte.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

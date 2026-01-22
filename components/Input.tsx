import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-900 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            block w-full rounded-xl border-gray-200 bg-gray-50 
            focus:bg-white focus:border-brand-900 focus:ring-1 focus:ring-brand-900 
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder-gray-400 text-gray-900
            transition-all duration-200 ease-in-out
            py-3.5
            ${icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
    </div>
  );
};
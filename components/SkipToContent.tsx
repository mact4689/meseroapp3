import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000] focus:px-6 focus:py-3 focus:bg-accent-500 focus:text-brand-900 focus:font-bold focus:rounded-xl focus:shadow-2xl focus:ring-4 focus:ring-accent-500/50 transition-all"
    >
      Saltar al contenido principal
    </a>
  );
};

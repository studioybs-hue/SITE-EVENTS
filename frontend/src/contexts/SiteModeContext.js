import React, { createContext, useContext, useState, useEffect } from 'react';

const SiteModeContext = createContext();

export const useSiteMode = () => {
  const context = useContext(SiteModeContext);
  if (!context) {
    throw new Error('useSiteMode must be used within SiteModeProvider');
  }
  return context;
};

export const SiteModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('siteMode') || null;
  });

  const setMode = (newMode) => {
    localStorage.setItem('siteMode', newMode);
    setModeState(newMode);
  };

  const clearMode = () => {
    localStorage.removeItem('siteMode');
    setModeState(null);
  };

  const isEvents = mode === 'events';
  const isPro = mode === 'pro';

  // Theme colors based on mode
  const theme = {
    events: {
      primary: '#D4AF37', // Gold
      primaryHover: '#B8960F',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/20 to-orange-500/20',
      text: 'text-yellow-500',
      textLight: 'text-yellow-400',
      border: 'border-yellow-500',
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-500/20',
      name: 'Événements',
      tagline: 'Vos événements méritent les meilleurs prestataires'
    },
    pro: {
      primary: '#3B82F6', // Blue
      primaryHover: '#2563EB',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      text: 'text-blue-500',
      textLight: 'text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-500/20',
      name: 'Professionnels',
      tagline: 'Des artisans qualifiés pour tous vos travaux'
    }
  };

  const currentTheme = mode ? theme[mode] : theme.events;

  return (
    <SiteModeContext.Provider value={{
      mode,
      setMode,
      clearMode,
      isEvents,
      isPro,
      theme: currentTheme,
      allThemes: theme
    }}>
      {children}
    </SiteModeContext.Provider>
  );
};

export default SiteModeContext;

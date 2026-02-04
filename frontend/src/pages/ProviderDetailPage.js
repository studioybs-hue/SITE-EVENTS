import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ProviderDetailPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      try {
        const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (userRes.ok) setUser(await userRes.json());
      } catch (e) {}

      try {
        const res = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
        setProvider(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [providerId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '6rem' }}>
          <div style={{ width: '3rem', height: '3rem', border: '4px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div style={{ textAlign: 'center', paddingTop: '6rem' }}>
          <p style={{ color: '#78716C' }}>Prestataire non trouvé</p>
        </div>
      </div>
    );
  }

  const isAuth = !!user;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <Navbar user={user} onLogout={() => setUser(null)} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'Playfair Display', marginBottom: '2rem' }}>
          {provider.business_name}
        </h1>

        {!isAuth && (
          <div style={{ background: 'white', padding: '3rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', border: '2px solid #D4AF37' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Pour contacter ce prestataire</h2>
            <p style={{ color: '#78716C', marginBottom: '2rem' }}>Créez un compte gratuit ou connectez-vous</p>
            <button 
              onClick={() => navigate('/login')}
              style={{ background: '#1C1917', color: 'white', padding: '0.75rem 2rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              Se connecter
            </button>
          </div>
        )}

        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Description</h2>
          <p style={{ color: '#78716C', lineHeight: '1.7' }}>{provider.description}</p>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Services</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {provider.services.map((s, i) => (
              <span key={i} style={{ background: '#F5E6D3', padding: '0.5rem 1rem', borderRadius: '4px' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

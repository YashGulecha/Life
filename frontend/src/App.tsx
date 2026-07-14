import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import client from './api/client';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user has an active local token
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setLoading(false);
    } else {
      // Fallback: Ping /auth/me in case we have active HttpOnly session cookies
      client.get('/auth/me')
        .then((res) => {
          setIsAuthenticated(true);
          setUserEmail(res.data.email);
          localStorage.setItem('user_email', res.data.email);
        })
        .catch(() => {
          setIsAuthenticated(false);
          setUserEmail('');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_email');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleLoginSuccess = (token: string, email: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_email', email);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      setUserEmail('');
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard email={userEmail} onLogout={handleLogout} />
      ) : (
        <AuthScreen onSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default App;

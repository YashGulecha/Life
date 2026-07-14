import React, { useState } from 'react';
import client from '../api/client';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (token: string, email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Register flow
        await client.post('/auth/register', { email, password });
        // Automatically login after registration
        const loginRes = await client.post('/auth/login', { email, password });
        const { access_token, user } = loginRes.data;
        onSuccess(access_token, user.email);
      } else {
        // Login flow
        const loginRes = await client.post('/auth/login', { email, password });
        const { access_token, user } = loginRes.data;
        onSuccess(access_token, user.email);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="glass-panel pulse-glow" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        textAlign: 'center',
        zIndex: 2,
        borderRadius: '24px'
      }}>
        {/* Glow behind logo */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--primary-gradient)',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '28px',
            color: 'white'
          }}>P</span>
        </div>

        <h1 style={{
          fontSize: '32px',
          marginBottom: '8px',
          background: 'var(--primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {isRegister ? 'Create Account' : 'Welcome to Pulse'}
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          {isRegister 
            ? 'Start orchestrating and managing your life engine' 
            : 'Enter your credentials to access your Life OS'}
        </p>

        {error && (
          <div style={{
            background: 'var(--error-glow)',
            border: '1px solid var(--error)',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              className="input-base"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                paddingLeft: '48px'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              className="input-base"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                paddingLeft: '48px'
              }}
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px',
              height: '48px'
            }}
          >
            {loading ? (
              <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                {isRegister ? 'Register' : 'Log In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginTop: '32px'
        }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {isRegister ? 'Log in here' : 'Register here'}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

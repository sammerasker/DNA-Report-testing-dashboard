/**
 * Password Protection Component
 * Wraps pages to require password authentication before access
 */

import { useState, useEffect } from 'react';

export default function PasswordProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if already authenticated on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('dna_report_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dna_report_authenticated', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Show loading state briefly
  if (isLoading) {
    return null;
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>DNA Report System</h1>
          <p style={styles.subtitle}>Please enter the password to continue</p>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              autoFocus
            />
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.button}>
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render protected content if authenticated
  return children;
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '1rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
    textAlign: 'center',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  error: {
    color: '#e00',
    fontSize: '0.875rem',
    margin: '0',
    textAlign: 'center'
  }
};

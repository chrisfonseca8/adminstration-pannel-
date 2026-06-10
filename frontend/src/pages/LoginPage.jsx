import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      setError('');
      setLoading(true);

      try {
        const response = await axios.post(
          `${API_BASE}/auth/google`,
          { code },
          { withCredentials: true }
        );

        const data = response.data;

        if (data.isNewUser) {
          navigate('/new-user', {
            state: {
              pendingToken: data.pendingToken,
              email: data.email || '',
            },
          });
          return;
        }

        navigate('/dashboard');
      } catch (error) {
        setError(error?.response?.data?.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    flow: 'auth-code',
    onError: () => {
      setError('Google login error');
    },
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Sign in with Google</h1>
      <button onClick={() => googleLogin()} disabled={loading}>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LoginPage;

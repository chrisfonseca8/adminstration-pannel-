import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

function App() {
  const [screen, setScreen] = useState('login');
  const [newUser, setNewUser] = useState({ sub: '', email: '', username: '' });
  const [existingUser, setExistingUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      setError('');
      setLoading(true);

      try {
        const response = await axios.post(`${API_BASE}/auth/google`, { code });
        const data = response.data;

        if (data.isNewUser) {
          setNewUser({ sub: data.sub, email: data.email, username: '' });
          setScreen('new-user');
          return;
        }

        setExistingUser(data.user);
        setScreen('welcome');
      } catch (error) {
        setError(error?.response?.data?.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    flow: 'auth-code',
    onError: () => {
      setError('Google login error');
    }
  });

  const handleUsernameChange = (event) => {
    setNewUser({ ...newUser, username: event.target.value });
  };

  const handleConfirmUsername = async (event) => {
    event.preventDefault();
    if (!newUser.username.trim()) {
      setError('Please enter a username');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/google/confirm`, {
        sub: newUser.sub,
        email: newUser.email,
        username: newUser.username.trim(),
      });

      setExistingUser(response.data.user);
      setScreen('welcome');
    } catch (error) {
      setError(error?.response?.data?.message || 'Could not confirm username');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setScreen('login');
    setNewUser({ sub: '', email: '', username: '' });
    setExistingUser(null);
    setError('');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      {screen === 'login' && (
        <div>
          <h1>Sign in with Google</h1>
          <button onClick={() => googleLogin()} disabled={loading}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}

      {screen === 'new-user' && (
        <div>
          <h1>Welcome, new user</h1>
          <p>Please choose a username to finish your account setup.</p>
          <p>Email: <strong>{newUser.email}</strong></p>
          <form onSubmit={handleConfirmUsername}>
            <label>
              Username
              <input
                type="text"
                value={newUser.username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                style={{ display: 'block', marginTop: 8, padding: 8, width: '100%', maxWidth: 360 }}
              />
            </label>
            <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={handleRestart} style={{ marginTop: 12 }}>
            Back to login
          </button>
        </div>
      )}

      {screen === 'welcome' && (
        <div>
          <h1>Welcome back!</h1>
          <p>You are logged in as <strong>{existingUser?.username || existingUser?.email}</strong>.</p>
          <p>Thank you for using the app.</p>
          <button onClick={handleRestart}>Log in with another account</button>
        </div>
      )}
    </div>
  );
}

export default App;

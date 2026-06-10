import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

const NewUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const pendingToken = state.pendingToken || '';
  const email = state.email || '';

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!pendingToken) {
      setError('Invalid session. Please log in again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/auth/google/confirm`,
        {
          pendingToken,
          username: username.trim(),
        },
        {
          withCredentials: true,
        }
      );

      navigate('/dashboard');
    } catch (error) {
      setError(error?.response?.data?.message || 'Could not confirm username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>New user setup</h1>
      <p>Please choose a username to finish your account setup.</p>
      <p>Email: <strong>{email}</strong></p>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ display: 'block', marginTop: 8, padding: 8, width: '100%', maxWidth: 360 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => navigate('/')} style={{ marginTop: 12 }}>
        Back to login
      </button>
    </div>
  );
};

export default NewUserPage;

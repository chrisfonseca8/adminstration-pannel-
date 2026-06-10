import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard from '../Dashboard.jsx';

const API_BASE = 'http://localhost:3000/api/v1';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${API_BASE}/dashboard`, {
          withCredentials: true,
        });

        setDashboardData(response.data);
      } catch (error) {
        const message = error?.response?.data?.message || 'Unable to load dashboard';
        setError(message);
        if (error?.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/')}>Back to login</button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>No data available</div>;
  }

  return <Dashboard dashboardData={dashboardData} onLogout={handleLogout} />;
};

export default DashboardPage;

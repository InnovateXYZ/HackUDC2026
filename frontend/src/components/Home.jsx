import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getToken } from '../utils/auth';

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    const token = getToken();

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    try {
      // Call backend logout endpoint
      const token = localStorage.getItem('access_token');
      if (token) {
        fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(err => console.error('Logout error:', err));
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      clearAuth();
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-base)' }}>
        <p style={{ color: 'var(--color-text)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-base)' }}>
      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Welcome, {user?.username || 'User'}!
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text)' }}>
            This is your home page. Here will be the main content of your application.
          </p>

          {/* Welcome Card */}
          <div
            className="p-6 rounded-lg shadow-lg mb-8"
            style={{ backgroundColor: 'var(--color-surface-dark0)' }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-accent)' }}>
              Profile Information
            </h2>
            <div style={{ color: 'var(--color-text)' }}>
              <p className="mb-2">
                <span className="font-semibold">Username:</span> {user?.username}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Email:</span> {user?.email}
              </p>
              {user?.name && (
                <p className="mb-2">
                  <span className="font-semibold">Name:</span> {user?.name}
                </p>
              )}
              {user?.age && (
                <p className="mb-2">
                  <span className="font-semibold">Age:</span> {user?.age}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section - Bottom Left */}
      <div
        className="fixed bottom-6 left-6 p-4 rounded-lg shadow-lg flex items-center gap-4"
        style={{ backgroundColor: 'var(--color-surface-dark0)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-denodo)' }}
        >
          <span className="text-white font-bold text-lg">
            {user?.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {user?.username}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 rounded transition-colors"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.8';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;

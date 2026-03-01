import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveToken } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * GitHubCallback — handles the OAuth redirect from GitHub.
 * Reads the `code` query param, sends it to the backend, and either
 * logs the user in or redirects to registration.
 */
function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code received from GitHub');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/github?code=${encodeURIComponent(code)}`, {
          method: 'POST',
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || 'GitHub authentication failed');
          return;
        }

        if (data.status === 'login') {
          saveToken(data.access_token, data.token_type);
          try { localStorage.setItem('user', JSON.stringify(data.user)); } catch {}
          navigate('/home', { replace: true });
        } else if (data.status === 'needs_registration') {
          const params = new URLSearchParams({ email: data.email, name: data.name || '' });
          navigate(`/register?${params.toString()}`, { replace: true });
        }
      } catch {
        setError('Could not connect to the server');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#242424]">
        <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg bg-[#f47721] text-white hover:bg-[#d9661a] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242424]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#333] border-t-[#f47721] animate-spin" />
        <p className="text-gray-400 text-sm">Signing in with GitHub...</p>
      </div>
    </div>
  );
}

export default GitHubCallback;

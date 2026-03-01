import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../utils/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To display login errors
  const navigate = useNavigate();

  // Google Sign-In callback
  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Google sign-in failed');
        return;
      }

      if (data.status === 'login') {
        // Existing user — save token and go home
        saveToken(data.access_token, data.token_type);
        try { localStorage.setItem('user', JSON.stringify(data.user)); } catch { }
        navigate('/home');
      } else if (data.status === 'needs_registration') {
        // New user — redirect to register with pre-filled email+name+picture
        const params = new URLSearchParams({ email: data.email, name: data.name || '', picture: data.picture || '' });
        navigate(`/register?${params.toString()}`);
      }
    } catch (err) {
      setError('Could not connect to the server');
    }
  };

  // Initialize Google Sign In with renderButton for reliability
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        ux_mode: 'popup',
      });
      // Render an invisible Google button we can click programmatically
      const container = document.getElementById('g_id_signin_hidden');
      if (container) {
        window.google.accounts.id.renderButton(container, {
          type: 'icon',
          size: 'large',
        });
      }
    };
    initGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleClick = () => {
    // Click the hidden rendered Google button to trigger the real OAuth popup
    const hiddenBtn = document.querySelector('#g_id_signin_hidden div[role="button"]');
    if (hiddenBtn) {
      hiddenBtn.click();
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const toErrorMessage = (detail, fallback = 'Error logging in') => {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') {
        return first.msg || first.message || fallback;
      }
      return fallback;
    }
    if (typeof detail === 'object') {
      return detail.msg || detail.message || fallback;
    }
    return fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Structure expected by your server
    const dataToSend = {
      email: email,
      password: password
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login:', data);
        // Save token and user info if available
        if (data.access_token) {
          saveToken(data.access_token, data.token_type);
        }
        if (data.user) {
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (err) {
            console.warn('Error to save in local storage', err);
          }
        }
        navigate('/home');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(toErrorMessage(errorData.detail ?? errorData.message));
      }
    } catch (err) {
      console.error('Network error:', err);
      setError(err?.message || 'Could not connect to the server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-[#242424]">
      <div className="w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-[#f47721]">K2</span> Platform
          </h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1e1e1e] border border-[#333] rounded-xl p-8 flex flex-col gap-5 shadow-lg">
          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="login-email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mail.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="login-password" className="text-sm font-medium text-gray-300">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-2.5 rounded-lg font-semibold text-white bg-[#f47721] hover:bg-[#d9661a] transition-colors cursor-pointer"
          >
            Log In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px bg-[#333]" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-[#333]" />
          </div>

          {/* Hidden Google rendered button */}
          <div id="g_id_signin_hidden" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2">
            {/* Google Sign In button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white bg-[#24292f] hover:bg-[#32383f] transition-colors border border-[#444]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>

            {/* GitHub Sign In button */}
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  client_id: GITHUB_CLIENT_ID,
                  redirect_uri: `${window.location.origin}/auth/github/callback`,
                  scope: 'user:email',
                });
                window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white bg-[#24292f] hover:bg-[#32383f] transition-colors border border-[#444]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </div>

          <div className="text-center mt-2">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button type="button" className="text-[#f47721] hover:underline font-medium" onClick={() => navigate('/register')}>
                Create one
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
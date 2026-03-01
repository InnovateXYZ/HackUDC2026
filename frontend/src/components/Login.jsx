import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../utils/auth';

const GOOGLE_CLIENT_ID = '526065876377-c6sfjd0bc4f23j637uf2vs4d5h7t8qrc.apps.googleusercontent.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To display login errors
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Google Sign-In callback
  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch('http://localhost:8000/auth/google', {
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
        try { localStorage.setItem('user', JSON.stringify(data.user)); } catch {}
        navigate('/home');
      } else if (data.status === 'needs_registration') {
        // New user — redirect to register with pre-filled email+name
        const params = new URLSearchParams({ email: data.email, name: data.name || '' });
        navigate(`/register?${params.toString()}`);
      }
    } catch (err) {
      setError('Could not connect to the server');
    }
  };

  // Initialize Google Sign In button
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        // GSI script not loaded yet, retry
        setTimeout(initGoogle, 200);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
      });
    };
    initGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const response = await fetch('http://localhost:8000/login', {
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
            <span className="text-[#f47721]">Denodo</span> Data Explorer
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

          {/* Google Sign In button */}
          <div ref={googleBtnRef} className="w-full flex justify-center" />

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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To display login errors
  const navigate = useNavigate();

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
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Register() {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';
  const prefillName = searchParams.get('name') || '';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState(prefillName);
  const [genderIdentity, setGenderIdentity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [userPreferences, setUserPreferences] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // currently not connected to any backend
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const payload = {
      username,
      email,
      password,
      // backend expects these field names (see backend schemas)
      name: name || undefined,
      gender_identity: genderIdentity || undefined,
      date_of_birth: dateOfBirth || undefined,
      user_preferences: userPreferences || undefined,
    };

    fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        setLoading(false);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const detail = data.detail || data.message || 'Registration failed';
          throw new Error(detail);
        }
        return res.json();
      })
      .then((user) => {
        // registration succeeded; navigate to login
        navigate('/login');
      })
      .catch((err) => {
        setError(err.message || 'Registration error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 bg-[#242424]">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-[#f47721]">Denodo</span> Data Explorer
          </h1>
          <p className="text-sm text-gray-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1e1e1e] border border-[#333] rounded-xl p-8 shadow-lg">
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Grid: 2 columns on md+, single column on small screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="register-username" className="text-sm font-medium text-gray-300">Username</label>
              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="register-email" className="text-sm font-medium text-gray-300">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@mail.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
              />
            </div>

            {/* Optional profile details */}
            <details className="md:col-span-2 p-4 rounded-lg border border-[#333] bg-[#2a2a2a]" open={false}>
              <summary className="cursor-pointer font-medium text-sm text-gray-300 hover:text-white transition-colors">Profile (optional)</summary>
              <p className="text-xs mt-2 mb-3 text-gray-500">Add extra info to personalize your experience.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="register-name" className="text-sm text-gray-400">Full name</label>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 rounded-lg bg-[#1e1e1e] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="register-gender" className="text-sm text-gray-400">Gender identity</label>
                  <input
                    id="register-gender"
                    type="text"
                    value={genderIdentity}
                    onChange={(e) => setGenderIdentity(e.target.value)}
                    placeholder="e.g. she/her"
                    className="w-full px-3 py-2 rounded-lg bg-[#1e1e1e] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="register-dob" className="text-sm text-gray-400">Date of birth</label>
                  <input
                    id="register-dob"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1e1e1e] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="register-prefs" className="text-sm text-gray-400">Preferences</label>
                  <input
                    id="register-prefs"
                    type="text"
                    value={userPreferences}
                    onChange={(e) => setUserPreferences(e.target.value)}
                    placeholder='e.g. "I like short answers..."'
                    className="w-full px-3 py-2 rounded-lg bg-[#1e1e1e] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-col gap-2 text-left md:col-span-2">
              <label htmlFor="register-password" className="text-sm font-medium text-gray-300">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 text-left md:col-span-2">
              <label htmlFor="register-confirm" className="text-sm font-medium text-gray-300">Confirm password</label>
              <input
                id="register-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="********"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-4 mt-2">
              <p className="hidden md:block text-sm text-gray-400">
                Already have an account?{' '}
                <button type="button" className="text-[#f47721] hover:underline font-medium" onClick={() => navigate('/login')}>
                  Log in
                </button>
              </p>

              <button
                type="submit"
                className="w-full md:w-auto py-2.5 px-6 rounded-lg font-semibold text-white bg-[#f47721] hover:bg-[#d9661a] transition-colors cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </div>

            {/* Small footer for small screens */}
            <div className="md:col-span-2 block md:hidden mt-2 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button type="button" className="text-[#f47721] hover:underline font-medium" onClick={() => navigate('/login')}>
                  Log in
                </button>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [age, setAge] = useState('');
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
      age: age ? Number(age) : undefined,
      user_preferences: userPreferences || undefined,
    };

    fetch('http://localhost:8000/register', {
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
    <div className="min-h-screen flex items-center justify-center w-full px-4">
      <form onSubmit={handleSubmit} className="bg-[#242424] p-8 rounded-lg shadow-lg w-full max-w-2xl text-white">
        <h2 className="text-2xl font-semibold mb-3">Create your account</h2>

        {error && <p className="text-[#ffb347] text-sm mb-3">{error}</p>}

        {/* Grid: 2 columns on md+, single column on small screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="register-username" className="text-sm">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="register-email" className="text-sm">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mail.com"
              required
              className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
            />
          </div>

          {/* Optional profile details tucked inside a collapsible block that spans both columns */}
          <details className="md:col-span-2 bg-[#1f1f1f] p-3 rounded-md" open={false}>
            <summary className="cursor-pointer font-medium text-sm text-white">Profile (optional)</summary>
            <p className="text-xs text-[#bdbdbd] mt-2 mb-3">Add extra info to personalize your experience.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-name" className="text-sm">Full name</label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-gender" className="text-sm">Gender identity</label>
                <input
                  id="register-gender"
                  type="text"
                  value={genderIdentity}
                  onChange={(e) => setGenderIdentity(e.target.value)}
                  placeholder="e.g. she/her"
                  className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-age" className="text-sm">Age</label>
                <input
                  id="register-age"
                  type="number"
                  min="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-prefs" className="text-sm">Preferences</label>
                <input
                  id="register-prefs"
                  type="text"
                  value={userPreferences}
                  onChange={(e) => setUserPreferences(e.target.value)}
                  placeholder='e.g. "I like short answers..."'
                  className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-2 text-left md:col-span-2">
            <label htmlFor="register-password" className="text-sm">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
            />
          </div>

          <div className="flex flex-col gap-2 text-left md:col-span-2">
            <label htmlFor="register-confirm" className="text-sm">Confirm password</label>
            <input
              id="register-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="********"
              required
              className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4 mt-2">
            <button type="submit" className="btn-primary w-full md:w-auto" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>

            <div className="hidden md:block bg-[#2a2a2a] p-2 rounded text-sm">
              <p className="text-white">Already have an account?</p>
              <button type="button" className="text-[#f47721] underline text-sm" onClick={() => navigate('/login')}>
                Log in
              </button>
            </div>
          </div>

          {/* Small footer for small screens */}
          <div className="md:col-span-2 block md:hidden bg-[#2a2a2a] p-2 rounded mt-2 text-center">
            <p className="text-sm text-white">
              Already have an account?{' '}
              <button type="button" className="text-[#f47721] underline" onClick={() => navigate('/login')}>
                Click here
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Register;

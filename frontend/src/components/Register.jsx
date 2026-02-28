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
    <div className="min-h-screen flex items-center justify-center w-full px-4" style={{ backgroundColor: 'var(--color-base)' }}>
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-lg w-full max-w-2xl" style={{ backgroundColor: 'var(--color-surface-dark0)', color: 'var(--color-text)' }}>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Create your account</h2>

        {error && <p className="text-orange-400 text-sm mb-3">{error}</p>}

        {/* Grid: 2 columns on md+, single column on small screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="register-username" className="text-sm" style={{ color: 'var(--color-text)' }}>Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="input-base"
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="register-email" className="text-sm" style={{ color: 'var(--color-text)' }}>Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mail.com"
              required
              className="input-base"
            />
          </div>

          {/* Optional profile details tucked inside a collapsible block that spans both columns */}
          <details className="md:col-span-2 p-3 rounded-md" open={false} style={{ backgroundColor: 'var(--color-overlay-light0)' }}>
            <summary className="cursor-pointer font-medium text-sm" style={{ color: 'var(--color-text-alt)' }}>Profile (optional)</summary>
            <p className="text-xs mt-2 mb-3 opacity-70" style={{ color: 'var(--color-text-alt)' }}>Add extra info to personalize your experience.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-name" className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Full name</label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="input-base"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-gender" className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Gender identity</label>
                <input
                  id="register-gender"
                  type="text"
                  value={genderIdentity}
                  onChange={(e) => setGenderIdentity(e.target.value)}
                  placeholder="e.g. she/her"
                  className="input-base"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-age" className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Age</label>
                <input
                  id="register-age"
                  type="number"
                  min="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 30"
                  className="input-base"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="register-prefs" className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Preferences</label>
                <input
                  id="register-prefs"
                  type="text"
                  value={userPreferences}
                  onChange={(e) => setUserPreferences(e.target.value)}
                  placeholder='e.g. "I like short answers..."'
                  className="input-base"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-2 text-left md:col-span-2">
            <label htmlFor="register-password" className="text-sm" style={{ color: 'var(--color-text)' }}>Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="input-base"
            />
          </div>

          <div className="flex flex-col gap-2 text-left md:col-span-2">
            <label htmlFor="register-confirm" className="text-sm" style={{ color: 'var(--color-text)' }}>Confirm password</label>
            <input
              id="register-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="********"
              required
              className="input-base"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4 mt-2">
            <button type="submit" className="btn-primary w-full md:w-auto" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>

            <div className="hidden md:block p-2 rounded text-sm" style={{ backgroundColor: 'var(--color-overlay-light0)' }}>
              <p style={{ color: 'var(--color-text-alt)' }}>Already have an account?</p>
              <button type="button" className="underline text-sm" style={{ color: 'var(--color-denodo)' }} onClick={() => navigate('/login')}>
                Log in
              </button>
            </div>
          </div>

          {/* Small footer for small screens */}
          <div className="md:col-span-2 block md:hidden p-2 rounded mt-2 text-center" style={{ backgroundColor: 'var(--color-overlay-light0)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
              Already have an account?{' '}
              <button type="button" className="underline" style={{ color: 'var(--color-denodo)' }} onClick={() => navigate('/login')}>
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

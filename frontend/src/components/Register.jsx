import { useRef, useState } from 'react';
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
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Image must be JPG, PNG, GIF, or WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB');
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const payload = {
      username,
      email,
      password,
      name: name || undefined,
      gender_identity: genderIdentity || undefined,
      date_of_birth: dateOfBirth || undefined,
      user_preferences: userPreferences || undefined,
    };

    try {
      // 1. Register user
      const regRes = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!regRes.ok) {
        const data = await regRes.json().catch(() => ({}));
        throw new Error(data.detail || data.message || 'Registration failed');
      }

      // 2. If there is a profile image, auto-login and upload it
      if (profileImage) {
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          const token = loginData.access_token;

          const formData = new FormData();
          formData.append('file', profileImage);

          await fetch(`${API_BASE}/me/profile-image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          // We don't fail registration if image upload fails
        }
      }

      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 bg-[#242424]">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-[#f47721]">K2</span> Platform
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

                {/* Profile image upload */}
                <div className="flex flex-col gap-2 text-left md:col-span-2">
                  <label htmlFor="register-profile-image" className="text-sm text-gray-400">Profile image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#f47721]"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#1e1e1e] border border-[#444] flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#333] border border-[#555] hover:bg-[#444] transition-colors cursor-pointer"
                      >
                        {profileImage ? 'Change image' : 'Upload image'}
                      </button>
                      <span className="text-xs text-gray-500">JPG, PNG, GIF, WebP · Max 5 MB</span>
                    </div>
                    <input
                      id="register-profile-image"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
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

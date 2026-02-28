import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // currently not connected to any backend
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    console.log('Simulated registration:', { username, email, password });
    alert('Simulated registration, check console');
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <form onSubmit={handleSubmit} className="bg-[#242424] p-8 rounded-lg shadow-lg w-full max-w-sm flex flex-col gap-5 text-white">
        <h2 className="text-2xl font-semibold">Register</h2>

        {error && <p className="text-[#ffb347] text-sm">{error}</p>}

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="register-username">Username:</label>
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
          <label htmlFor="register-email">Email:</label>
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

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="register-password">Password:</label>
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

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="register-confirm">Confirm password:</label>
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

        <button type="submit" className="btn-primary mt-2">Create account</button>

        <div className="bg-[#2a2a2a] p-2 rounded mt-2 text-center">
          <p className="text-sm text-white">
            Already have an account?{' '}
            <button type="button" className="text-[#f47721] underline" onClick={() => navigate('/login')}>
              Click here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Alert } from '../components/Feedback.jsx';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';

// Created by "npm run seed". Handy for the demo; remove this box for a real system.
const demoAccounts = [
  { label: 'Patient', email: 'aarav.mehta@example.com', password: 'Patient@123' },
  { label: 'Doctor', email: 'meera.kapoor@aarogya.example', password: 'Doctor@123' },
  { label: 'Admin', email: 'admin@aarogya.example', password: 'Admin@123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />; // already logged in

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(location.state?.from || homeFor(u.role), { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow-sm">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Log in as a patient, doctor or admin.</p>
        <form className="form" onSubmit={submit} noValidate>
          <Alert>{error}</Alert>
          <label className="field">Email
            <input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">Password
            <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn btn-primary btn-lg" disabled={busy}><LogIn size={18} /> {busy ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="muted center">New patient? <Link className="link" to="/register">Create an account</Link></p>

        <div className="demo-accounts">
          <strong>Demo accounts</strong> <span className="muted">(click to fill)</span>
          <div className="btn-row">
            {demoAccounts.map((a) => (
              <button key={a.label} type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ email: a.email, password: a.password })}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

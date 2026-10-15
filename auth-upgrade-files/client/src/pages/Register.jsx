import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Alert } from '../components/Feedback.jsx';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';

// Only patients can register here. Doctor accounts are created by the admin.
export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number (7-15 digits)';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const { confirm, ...data } = form;
      await register(data);
      navigate('/doctors', { replace: true });
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow-sm">
      <div className="card auth-card">
        <h1>Create patient account</h1>
        <p className="muted">Register to book and manage your appointments.</p>
        <form className="form" onSubmit={submit} noValidate>
          <Alert>{serverError}</Alert>
          <label className="field">Full name *
            <input value={form.name} onChange={set('name')} />
            {errors.name && <span className="err">{errors.name}</span>}
          </label>
          <label className="field">Email *
            <input type="email" value={form.email} onChange={set('email')} />
            {errors.email && <span className="err">{errors.email}</span>}
          </label>
          <label className="field">Phone number *
            <input value={form.phone} onChange={set('phone')} inputMode="tel" />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </label>
          <div className="form-row">
            <label className="field">Password *
              <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
              {errors.password && <span className="err">{errors.password}</span>}
            </label>
            <label className="field">Confirm password *
              <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
              {errors.confirm && <span className="err">{errors.confirm}</span>}
            </label>
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy}><UserPlus size={18} /> {busy ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="muted center">Already registered? <Link className="link" to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // The menu changes with the logged-in role
  const links = [{ to: '/', label: 'Home', end: true }, { to: '/doctors', label: 'Find a doctor' }];
  if (user?.role === 'patient') links.push({ to: '/book', label: 'Book appointment' }, { to: '/my-appointments', label: 'My appointments' });
  if (user?.role === 'doctor') links.push({ to: '/doctor-dashboard', label: 'My dashboard' });
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Admin dashboard' });

  const close = () => setOpen(false);
  const handleLogout = () => { logout(); close(); navigate('/'); };

  return (
    <header className="site-header">
      <nav className="container nav">
        <Link to="/" className="logo" onClick={close}>
          <span className="logo-mark"><Stethoscope size={20} /></span>
          <span>Aarogya Care<small>Hospital</small></span>
        </Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <li key={l.to}><NavLink to={l.to} end={l.end} onClick={close}>{l.label}</NavLink></li>
          ))}
          {user ? (
            <li className="nav-auth">
              <span className="nav-user">{user.name} <em className={`role role-${user.role}`}>{user.role}</em></span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}><LogOut size={14} /> Log out</button>
            </li>
          ) : (
            <li className="nav-auth">
              <Link className="btn btn-ghost btn-sm" to="/login" onClick={close}>Log in</Link>
              <Link className="btn btn-primary btn-sm" to="/register" onClick={close}>Register</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

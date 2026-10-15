// Wrap a page with this to control who may open it.
//   <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
import { Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './Feedback.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container section"><Loader text="Checking your login..." /></div>;

  // Not logged in -> go to login, and come back here afterwards
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  // Logged in but the wrong role -> access denied
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container section narrow">
        <div className="card success-card denied">
          <ShieldAlert size={48} />
          <h1>Access denied</h1>
          <p>This page is only for {roles.join(' / ')} accounts. You are logged in as a {user.role}.</p>
          <Link className="btn btn-primary" to="/">Go to home</Link>
        </div>
      </div>
    );
  }
  return children;
}

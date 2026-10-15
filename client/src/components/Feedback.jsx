import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export const Loader = ({ text = 'Loading...' }) => (
  <div className="loader"><span className="spinner" /> {text}</div>
);

export const Alert = ({ type = 'error', children }) =>
  children ? (
    <div className={`alert alert-${type}`} role="alert">
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  ) : null;

export const Empty = ({ title, children }) => (
  <div className="empty">
    <Inbox size={32} />
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

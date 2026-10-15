import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppointmentTable from '../components/AppointmentTable.jsx';
import { Loader, Alert, Empty } from '../components/Feedback.jsx';
import { getAppointments, cancelAppointment, errMsg } from '../services/api.js';

// Patient-only page. The server returns only the logged-in patient's appointments.
export default function MyAppointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    getAppointments()
      .then((d) => { setItems(d); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (a) => {
    if (!window.confirm(`Cancel your appointment with ${a.doctor.name} on ${a.date}?`)) return;
    try {
      await cancelAppointment(a._id);
      setMessage('Appointment cancelled. The time slot is free again.');
      setError('');
      load(); // refresh the list
    } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="container section">
      <h1>My appointments</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? <Loader />
        : items.length === 0 ? (
          <Empty title="No appointments yet">
            <Link className="link" to="/doctors">Find a doctor</Link> and book your first appointment.
          </Empty>
        ) : (
          <AppointmentTable
            items={items} showPatient={false} showDoctor
            renderActions={(a) => a.status === 'Booked'
              ? <button className="btn btn-danger btn-sm" onClick={() => cancel(a)}>Cancel appointment</button>
              : <span className="muted">-</span>}
          />
        )}
    </div>
  );
}

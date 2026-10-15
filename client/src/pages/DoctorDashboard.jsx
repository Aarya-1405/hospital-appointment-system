import { useEffect, useState } from 'react';
import AppointmentTable from '../components/AppointmentTable.jsx';
import Avatar from '../components/Avatar.jsx';
import { Loader, Alert, Empty } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getDoctor, getAppointments, setAppointmentStatus, errMsg } from '../services/api.js';
import { todayStr } from '../services/format.js';

// Doctor-only page. The server returns only THIS doctor's appointments.
export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([getDoctor(user.doctor), getAppointments()])
      .then(([d, a]) => { setDoctor(d); setItems(a); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const update = async (a, status) => {
    try { await setAppointmentStatus(a._id, status); load(); }
    catch (e) { setError(errMsg(e)); }
  };

  const today = todayStr();
  const todays = items.filter((a) => a.date === today);
  const upcoming = items.filter((a) => a.date > today);
  const earlier = items.filter((a) => a.date < today);

  const actions = (a) => a.status === 'Booked' ? (
    <>
      <button className="btn btn-teal btn-sm" onClick={() => update(a, 'Completed')}>Mark completed</button>
      <button className="btn btn-danger btn-sm" onClick={() => update(a, 'Cancelled')}>Cancel</button>
    </>
  ) : <span className="muted">-</span>;

  const block = (title, list, empty) => (
    <section className="dash-block">
      <h2>{title} <span className="count">{list.length}</span></h2>
      {list.length === 0 ? <Empty title={empty}>Nothing to show here.</Empty> : <AppointmentTable items={list} renderActions={actions} />}
    </section>
  );

  return (
    <div className="container section">
      <h1>Doctor dashboard</h1>
      <Alert>{error}</Alert>
      {loading ? <Loader /> : doctor && (
        <>
          <div className="card profile-strip">
            <Avatar name={doctor.name} size={56} />
            <div><h3>{doctor.name}</h3><span className="chip chip-teal">{doctor.specialization}</span></div>
          </div>
          {block("Today's appointments", todays, 'No appointments today')}
          {block('Upcoming appointments', upcoming, 'No upcoming appointments')}
          {earlier.length > 0 && block('Earlier appointments', earlier, '')}
        </>
      )}
    </div>
  );
}

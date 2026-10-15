import { useEffect, useState } from 'react';
import { Users, CalendarDays, CalendarClock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import AppointmentTable from '../components/AppointmentTable.jsx';
import { Loader, Alert, Empty } from '../components/Feedback.jsx';
import {
  getStats, getAllDoctors, getDepartments, getAppointments, addDoctor, updateDoctor, deactivateDoctor, errMsg,
} from '../services/api.js';
import { DAYS, ALL_SLOTS, fmtTime } from '../services/format.js';

const blankDoctor = {
  name: '', specialization: '', qualifications: '', experience: '', fee: '',
  availableDays: [], slots: [], bio: '', loginEmail: '', loginPassword: '',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('appointments');
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({ doctorId: '', status: '' });
  const [form, setForm] = useState(null);       // null = form hidden, object = form shown
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStats = () => getStats().then(setStats).catch((e) => setError(errMsg(e)));
  const loadDoctors = () => getAllDoctors().then(setDoctors).catch((e) => setError(errMsg(e)));
  const loadAppointments = () =>
    getAppointments(filters).then(setAppointments).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    Promise.all([loadStats(), loadDoctors(), getDepartments().then(setDepartments).catch(() => {})])
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadAppointments(); }, [filters]);

  const toggle = (field, value) => setForm((f) => ({
    ...f, [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value],
  }));

  const openAdd = () => { setForm({ ...blankDoctor }); setEditingId(null); setError(''); setMessage(''); };
  const openEdit = (d) => {
    setForm({ ...d, experience: String(d.experience), fee: String(d.fee) });
    setEditingId(d._id); setError(''); setMessage('');
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, experience: Number(form.experience), fee: Number(form.fee), slots: [...form.slots].sort() };
    delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt;
    if (editingId) { delete payload.loginEmail; delete payload.loginPassword; } // logins are only set when adding
    try {
      if (editingId) await updateDoctor(editingId, payload); else await addDoctor(payload);
      setMessage(editingId ? 'Doctor updated.' : 'Doctor added.');
      setForm(null); setEditingId(null);
      loadDoctors(); loadStats();
    } catch (err) { setError(errMsg(err)); }
  };

  const setActive = async (d, active) => {
    if (!active && !window.confirm(`Deactivate ${d.name}? Patients will no longer be able to book this doctor.`)) return;
    try {
      if (active) await updateDoctor(d._id, { isActive: true }); else await deactivateDoctor(d._id);
      setMessage(active ? `${d.name} is active again.` : `${d.name} has been deactivated.`);
      loadDoctors(); loadStats();
    } catch (err) { setError(errMsg(err)); }
  };

  if (loading) return <div className="container section"><Loader /></div>;

  const cards = stats && [
    { label: 'Total doctors', value: stats.totalDoctors, icon: Users },
    { label: 'Total appointments', value: stats.totalAppointments, icon: CalendarDays },
    { label: 'Upcoming', value: stats.upcoming, icon: CalendarClock },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle },
  ];

  return (
    <div className="container section">
      <h1>Admin dashboard</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      <div className="grid grid-5">
        {cards?.map((c) => (
          <div className="card stat" key={c.label}>
            <c.icon size={20} />
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>Appointments</button>
        <button className={tab === 'doctors' ? 'active' : ''} onClick={() => setTab('doctors')}>Doctors</button>
      </div>

      {tab === 'appointments' && (
        <>
          <div className="filters">
            <select value={filters.doctorId} onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}>
              <option value="">All doctors</option>
              {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option>Booked</option><option>Completed</option><option>Cancelled</option>
            </select>
            {(filters.doctorId || filters.status) && (
              <button className="btn btn-ghost" onClick={() => setFilters({ doctorId: '', status: '' })}>Clear filters</button>
            )}
          </div>
          {appointments.length === 0
            ? <Empty title="No appointments match">Try changing or clearing the filters.</Empty>
            : <AppointmentTable items={appointments} showDoctor />}
        </>
      )}

      {tab === 'doctors' && (
        <>
          {!form && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add doctor</button>}

          {form && (
            <form className="card form" onSubmit={save}>
              <h2>{editingId ? 'Edit doctor' : 'Add a doctor'}</h2>
              <div className="form-row">
                <label className="field">Name *
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" />
                </label>
                <label className="field">Specialization *
                  <select required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}>
                    <option value="">Select</option>
                    {departments.map((d) => <option key={d._id}>{d.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="field">Qualifications *
                <input required value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} placeholder="e.g. MBBS, MD" />
              </label>
              <div className="form-row">
                <label className="field">Experience (years) *
                  <input required type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                </label>
                <label className="field">Consultation fee (₹) *
                  <input required type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
                </label>
              </div>
              <div className="field">Available days *
                <div className="check-row">
                  {DAYS.map((d) => (
                    <label key={d} className="check"><input type="checkbox" checked={form.availableDays.includes(d)} onChange={() => toggle('availableDays', d)} /> {d.slice(0, 3)}</label>
                  ))}
                </div>
              </div>
              <div className="field">Time slots *
                <div className="check-row">
                  {ALL_SLOTS.map((s) => (
                    <label key={s} className="check"><input type="checkbox" checked={form.slots.includes(s)} onChange={() => toggle('slots', s)} /> {fmtTime(s)}</label>
                  ))}
                </div>
              </div>
              {!editingId && (
                <div className="form-row">
                  <label className="field">Doctor login email *
                    <input required type="email" value={form.loginEmail} onChange={(e) => setForm({ ...form, loginEmail: e.target.value })} placeholder="doctor@aarogya.example" />
                  </label>
                  <label className="field">Doctor login password * (min 6)
                    <input required type="text" minLength="6" value={form.loginPassword} onChange={(e) => setForm({ ...form, loginPassword: e.target.value })} />
                  </label>
                </div>
              )}
              <label className="field">Short bio
                <textarea rows="2" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </label>
              <div className="btn-row">
                <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add doctor'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</button>
              </div>
            </form>
          )}

          <div className="table-wrap" style={{ marginTop: 20 }}>
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>Experience</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d._id}>
                    <td><strong>{d.name}</strong><div className="muted">{d.qualifications}</div></td>
                    <td>{d.specialization}</td>
                    <td>{d.experience} yrs</td>
                    <td>₹{d.fee}</td>
                    <td><span className={`status ${d.isActive ? 'status-completed' : 'status-cancelled'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                      {d.isActive
                        ? <button className="btn btn-danger btn-sm" onClick={() => setActive(d, false)}>Deactivate</button>
                        : <button className="btn btn-teal btn-sm" onClick={() => setActive(d, true)}>Activate</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

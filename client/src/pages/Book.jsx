import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Loader, Alert } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getDoctors, getSlots, bookAppointment, errMsg } from '../services/api.js';
import { todayStr, fmtDate, fmtTime } from '../services/format.js';

export default function Book() {
  const { user } = useAuth(); // this page is patient-only, so user is always a patient here
  const [params] = useSearchParams(); // "?doctor=<id>" comes from the Book appointment button on a doctor card
  const emptyForm = { phone: user.phone || '', doctor: '', date: '', time: '', reason: '' };
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, doctor: params.get('doctor') || '' });
  const [slots, setSlots] = useState([]);
  const [slotMsg, setSlotMsg] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null); // holds the saved appointment after success
  const [loading, setLoading] = useState(true);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    getDoctors().then(setDoctors).catch((e) => setServerError(errMsg(e))).finally(() => setLoading(false));
  }, []);

  // Load free slots whenever the doctor or date changes
  const loadSlots = (doctor, date) => {
    if (!doctor || !date) { setSlots([]); setSlotMsg(''); return; }
    if (date < todayStr()) { setSlots([]); setSlotMsg('Please choose today or a future date.'); return; }
    setSlotsLoading(true);
    getSlots(doctor, date)
      .then((r) => { setSlots(r.slots); setSlotMsg(r.message); })
      .catch((e) => { setSlots([]); setSlotMsg(errMsg(e)); })
      .finally(() => setSlotsLoading(false));
  };
  useEffect(() => {
    setForm((f) => ({ ...f, time: '' }));
    loadSlots(form.doctor, form.date);
  }, [form.doctor, form.date]);

  const validate = () => {
    const e = {};
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number (7-15 digits)';
    if (!form.doctor) e.doctor = 'Select a doctor';
    if (!form.date) e.date = 'Select a date';
    else if (form.date < todayStr()) e.date = 'You cannot book a date in the past';
    if (!form.time) e.time = 'Select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    try {
      setBooked(await bookAppointment(form)); // name and email are taken from your account by the server
    } catch (e) {
      setServerError(errMsg(e));
      loadSlots(form.doctor, form.date); // refresh in case someone else took the slot
      setForm((f) => ({ ...f, time: '' }));
    } finally {
      setBusy(false);
    }
  };

  if (booked) {
    return (
      <div className="container section narrow">
        <div className="card success-card">
          <CheckCircle2 size={48} />
          <h1>Appointment booked</h1>
          <p>Thank you, {booked.patientName}. Your appointment is confirmed.</p>
          <dl className="summary">
            <div><dt>Doctor</dt><dd>{booked.doctor.name} ({booked.doctor.specialization})</dd></div>
            <div><dt>Date</dt><dd>{fmtDate(booked.date)}</dd></div>
            <div><dt>Time</dt><dd>{fmtTime(booked.time)}</dd></div>
            <div><dt>Fee</dt><dd>₹{booked.doctor.fee}</dd></div>
          </dl>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/my-appointments">View my appointments</Link>
            <button className="btn btn-ghost" onClick={() => { setBooked(null); setForm(emptyForm); }}>Book another</button>
          </div>
        </div>
      </div>
    );
  }

  const selectedDoctor = doctors.find((d) => d._id === form.doctor);

  return (
    <div className="container section narrow">
      <h1>Book an appointment</h1>
      <p className="muted">Choose a doctor, a date and a free time slot.</p>
      {loading ? <Loader /> : (
        <form className="card form" onSubmit={submit} noValidate>
          <Alert>{serverError}</Alert>

          <div className="form-row">
            <label className="field">Patient name
              <input className="readonly" value={user.name} readOnly />
            </label>
            <label className="field">Email
              <input className="readonly" value={user.email} readOnly />
            </label>
          </div>
          <label className="field">Phone number *
            <input value={form.phone} onChange={set('phone')} placeholder="e.g. 9876500011" inputMode="tel" />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </label>

          <div className="form-row">
            <label className="field">Doctor *
              <select value={form.doctor} onChange={set('doctor')}>
                <option value="">Select a doctor</option>
                {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} - {d.specialization}</option>)}
              </select>
              {errors.doctor && <span className="err">{errors.doctor}</span>}
            </label>
            <label className="field">Appointment date *
              <input type="date" min={todayStr()} value={form.date} onChange={set('date')} />
              {errors.date && <span className="err">{errors.date}</span>}
            </label>
          </div>

          {selectedDoctor && (
            <p className="hint">Available on {selectedDoctor.availableDays.join(', ')}. Consultation fee ₹{selectedDoctor.fee}.</p>
          )}

          <div className="field">Time slot *
            {slotsLoading ? <Loader text="Checking availability..." /> : slots.length > 0 ? (
              <div className="slot-grid">
                {slots.map((s) => (
                  <button
                    type="button" key={s.time} disabled={!s.available}
                    className={`slot ${form.time === s.time ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, time: s.time })}
                  >{fmtTime(s.time)}</button>
                ))}
              </div>
            ) : <p className="muted">{slotMsg || 'Choose a doctor and a date to see available slots.'}</p>}
            {errors.time && <span className="err">{errors.time}</span>}
          </div>

          <label className="field">Reason for visit (optional)
            <textarea rows="3" maxLength="300" value={form.reason} onChange={set('reason')} placeholder="Briefly describe your concern" />
          </label>

          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Booking...' : 'Confirm appointment'}</button>
        </form>
      )}
    </div>
  );
}

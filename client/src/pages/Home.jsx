import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Brain, Baby, Bone, Sparkles, Stethoscope, Ear, Flower2, Eye, MessageCircle, Activity, Smile,
  Search, CalendarCheck, CheckCircle2, ArrowRight,
} from 'lucide-react';
import DoctorCard from '../components/DoctorCard.jsx';
import { Loader, Alert } from '../components/Feedback.jsx';
import { getDoctors, getDepartments, errMsg } from '../services/api.js';

// Maps the icon name saved in MongoDB to the real icon component
const icons = { Heart, Brain, Baby, Bone, Sparkles, Stethoscope, Ear, Flower2, Eye, MessageCircle, Activity, Smile };

const steps = [
  { icon: Search, title: 'Choose a doctor', text: 'Search by name or specialization and compare experience and fees.' },
  { icon: CalendarCheck, title: 'Pick a date and slot', text: 'You only see the time slots that are still free.' },
  { icon: CheckCircle2, title: 'Get your confirmation', text: 'Your booking is saved instantly and shows up in My appointments.' },
];

export default function Home() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDoctors(), getDepartments()])
      .then(([d, dep]) => { setDoctors(d); setDepartments(dep); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const featured = [...doctors].sort((a, b) => b.experience - a.experience).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Your Health, Our Priority</h1>
            <p className="lead">
              Book appointments with trusted specialists in a few clicks. See real availability,
              pick a time that suits you and manage your visits from one place.
            </p>
            <div className="btn-row">
              <Link to="/doctors" className="btn btn-primary btn-lg">Find a doctor</Link>
              <Link to="/my-appointments" className="btn btn-ghost btn-lg">View my appointments</Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-stat"><strong>{loading ? '-' : doctors.length}</strong><span>specialist doctors</span></div>
            <div className="hero-stat"><strong>{loading ? '-' : departments.length}</strong><span>departments</span></div>
            <div className="hero-stat"><strong>30 min</strong><span>appointment slots</span></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Featured doctors</h2>
          <Link to="/doctors" className="link">See all doctors <ArrowRight size={16} /></Link>
        </div>
        <Alert>{error}</Alert>
        {loading ? <Loader /> : <div className="grid grid-3">{featured.map((d) => <DoctorCard key={d._id} doctor={d} />)}</div>}
      </section>

      <section className="band">
        <div className="container section">
          <h2>Hospital departments</h2>
          <div className="grid grid-4">
            {departments.map((dep) => {
              const Icon = icons[dep.icon] || Stethoscope;
              return (
                <Link key={dep._id} to={`/doctors?specialization=${encodeURIComponent(dep.name)}`} className="card dept-card">
                  <span className="dept-icon"><Icon size={22} /></span>
                  <h3>{dep.name}</h3>
                  <p>{dep.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>How booking works</h2>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title} className="card step">
              <span className="step-num">{i + 1}</span>
              <s.icon size={22} className="step-icon" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

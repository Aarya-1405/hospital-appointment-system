import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import DoctorCard from '../components/DoctorCard.jsx';
import { Loader, Alert, Empty } from '../components/Feedback.jsx';
import { getDoctors, getDepartments, errMsg } from '../services/api.js';

export default function Doctors() {
  const [params] = useSearchParams(); // lets the Home page send us "?specialization=Cardiology"
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState(params.get('specialization') || '');
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getDepartments().then(setDepartments).catch((e) => setError(errMsg(e))); }, []);

  // Re-fetch whenever the search text or filter changes (with a short delay while typing)
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getDoctors({ search, specialization })
        .then((d) => { setDoctors(d); setError(''); })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, specialization]);

  return (
    <div className="container section">
      <h1>Find a doctor</h1>
      <p className="muted">Search by name or filter by specialization, then book a slot.</p>

      <div className="filters">
        <label className="search-box">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by doctor name" />
        </label>
        <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
          <option value="">All specializations</option>
          {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>
        {(search || specialization) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setSpecialization(''); }}>Clear filters</button>
        )}
      </div>

      <Alert>{error}</Alert>
      {loading ? <Loader text="Finding doctors..." /> : doctors.length === 0 ? (
        <Empty title="No doctors found">Try a different name or choose another specialization.</Empty>
      ) : (
        <div className="grid grid-3">{doctors.map((d) => <DoctorCard key={d._id} doctor={d} />)}</div>
      )}
    </div>
  );
}

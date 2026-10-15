import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, CalendarDays, Clock } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { fmtTime } from '../services/format.js';

// Props: "doctor" is one doctor object from the API.
export default function DoctorCard({ doctor }) {
  const short = (d) => d.slice(0, 3);
  const first = doctor.slots[0];
  const last = doctor.slots[doctor.slots.length - 1];

  return (
    <article className="card doctor-card">
      <div className="doctor-top">
        <Avatar name={doctor.name} />
        <div>
          <h3>{doctor.name}</h3>
          <span className="chip chip-teal">{doctor.specialization}</span>
        </div>
      </div>
      <ul className="doctor-facts">
        <li><GraduationCap size={16} /> {doctor.qualifications}</li>
        <li><Briefcase size={16} /> {doctor.experience} years of experience</li>
        <li><CalendarDays size={16} /> {doctor.availableDays.map(short).join(', ')}</li>
        <li><Clock size={16} /> Slots from {fmtTime(first)} to {fmtTime(last)}</li>
      </ul>
      <div className="doctor-bottom">
        <div className="fee">₹{doctor.fee}<small>consultation</small></div>
        <Link className="btn btn-primary" to={`/book?doctor=${doctor._id}`}>Book appointment</Link>
      </div>
    </article>
  );
}

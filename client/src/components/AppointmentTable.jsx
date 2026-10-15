import { fmtDate, fmtTime } from '../services/format.js';

export const StatusBadge = ({ status }) => <span className={`status status-${status.toLowerCase()}`}>{status}</span>;

// Reusable table. Props:
//  items: list of appointments
//  showPatient / showDoctor: which columns to show
//  renderActions: optional function(appointment) that returns buttons for the last column
export default function AppointmentTable({ items, showPatient = true, showDoctor = false, renderActions }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {showPatient && <th>Patient</th>}
            {showDoctor && <th>Doctor</th>}
            <th>Date</th>
            <th>Time</th>
            <th>Reason</th>
            <th>Status</th>
            {renderActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              {showPatient && <td><strong>{a.patientName}</strong><div className="muted">{a.phone}</div></td>}
              {showDoctor && <td>{a.doctor?.name}<div className="muted">{a.doctor?.specialization}</div></td>}
              <td>{fmtDate(a.date)}</td>
              <td>{fmtTime(a.time)}</td>
              <td className="muted">{a.reason || '-'}</td>
              <td><StatusBadge status={a.status} /></td>
              {renderActions && <td className="actions">{renderActions(a)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

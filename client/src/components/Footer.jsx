import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Aarogya Care Hospital</h3>
          <p>A fictional hospital created for a college project. All doctors, patients and data are made up.</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <p><Link to="/doctors">Find a doctor</Link></p>
          <p><Link to="/book">Book appointment</Link></p>
          <p><Link to="/my-appointments">My appointments</Link></p>
        </div>
        <div>
          <h4>Contact</h4>
          <p><Phone size={14} /> +91 98765 43210</p>
          <p><Mail size={14} /> care@aarogya-demo.example</p>
          <p><MapPin size={14} /> 12 Lakeview Road, Mumbai, India</p>
          <p><Clock size={14} /> Mon to Sat, 9:00 AM to 6:00 PM</p>
        </div>
      </div>
      <div className="footer-bottom">Demo project. Not for real medical use.</div>
    </footer>
  );
}

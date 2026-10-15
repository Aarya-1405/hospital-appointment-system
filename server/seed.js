// Fills the database with FICTIONAL departments, doctors and a few appointments.
// Run with:  npm run seed   (inside the server folder). Safe to re-run: it clears old data first.
require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
const { weekdayOf } = require('./utils/dates');

const MORNING = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const BOTH = [...MORNING, ...AFTERNOON];
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const departments = [
  ['Cardiology', 'Heart care, ECG and blood pressure management', 'Heart'],
  ['Neurology', 'Brain, spine and nervous system conditions', 'Brain'],
  ['Pediatrics', 'Healthcare for babies, children and teens', 'Baby'],
  ['Orthopedics', 'Bones, joints and sports injuries', 'Bone'],
  ['Dermatology', 'Skin, hair and nail care', 'Sparkles'],
  ['General Medicine', 'First point of care for everyday illness', 'Stethoscope'],
  ['ENT', 'Ear, nose and throat treatment', 'Ear'],
  ['Gynecology', 'Women\'s health and maternity care', 'Flower2'],
  ['Ophthalmology', 'Eye tests and vision care', 'Eye'],
  ['Psychiatry', 'Mental health counselling and care', 'MessageCircle'],
  ['Gastroenterology', 'Digestive system and liver care', 'Activity'],
  ['Dentistry', 'Dental checkups and oral health', 'Smile'],
].map(([name, description, icon]) => ({ name, description, icon }));

const D = (name, specialization, qualifications, experience, fee, availableDays, slots, bio) =>
  ({ name, specialization, qualifications, experience, fee, availableDays, slots, bio });

const doctors = [
  D('Dr. Meera Kapoor', 'Cardiology', 'MBBS, MD, DM (Cardiology)', 14, 800, ['Monday', 'Wednesday', 'Friday'], MORNING, 'Focuses on preventive cardiology and heart failure care.'),
  D('Dr. Arjun Deshmukh', 'Neurology', 'MBBS, MD, DM (Neurology)', 11, 900, ['Tuesday', 'Thursday', 'Saturday'], BOTH, 'Treats migraine, epilepsy and stroke recovery.'),
  D('Dr. Sunita Rao', 'Pediatrics', 'MBBS, DCH', 9, 500, WEEK, MORNING, 'Friendly child specialist with a focus on vaccinations and growth.'),
  D('Dr. Kabir Sethi', 'Orthopedics', 'MBBS, MS (Orthopedics)', 16, 700, ['Monday', 'Tuesday', 'Thursday'], AFTERNOON, 'Joint replacement and sports injury surgeon.'),
  D('Dr. Ananya Bose', 'Dermatology', 'MBBS, MD (Dermatology)', 7, 600, ['Wednesday', 'Friday', 'Saturday'], BOTH, 'Acne, eczema and cosmetic dermatology.'),
  D('Dr. Vikram Joshi', 'General Medicine', 'MBBS, MD (Medicine)', 12, 400, [...WEEK, 'Saturday'], BOTH, 'Diabetes, fever, infections and routine health checks.'),
  D('Dr. Farhan Qureshi', 'ENT', 'MBBS, MS (ENT)', 10, 600, ['Monday', 'Wednesday', 'Thursday'], AFTERNOON, 'Sinus, hearing and throat disorders.'),
  D('Dr. Lakshmi Pillai', 'Gynecology', 'MBBS, MS (OBG)', 15, 750, ['Tuesday', 'Thursday', 'Friday'], MORNING, 'Pregnancy care and women\'s wellness.'),
  D('Dr. Nikhil Varma', 'Ophthalmology', 'MBBS, MS (Ophthalmology)', 8, 550, ['Monday', 'Tuesday', 'Friday'], BOTH, 'Cataract care and vision correction.'),
  D('Dr. Rhea D\'Souza', 'Psychiatry', 'MBBS, MD (Psychiatry)', 6, 800, ['Wednesday', 'Thursday', 'Saturday'], AFTERNOON, 'Anxiety, stress and sleep counselling.'),
  D('Dr. Sameer Khanna', 'Gastroenterology', 'MBBS, MD, DM (Gastro)', 13, 850, ['Tuesday', 'Wednesday', 'Friday'], MORNING, 'Acid reflux, liver and gut health.'),
  D('Dr. Tara Menon', 'Dentistry', 'BDS, MDS', 5, 450, [...WEEK, 'Saturday'], BOTH, 'Routine dental care, braces and root canal treatment.'),
];

// first upcoming date (today or later) on which the doctor works
function nextWorkingDate(doctor, skip = 0) {
  const d = new Date();
  let found = -1;
  for (let i = 0; i < 60; i++) {
    const probe = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    const s = `${probe.getFullYear()}-${String(probe.getMonth() + 1).padStart(2, '0')}-${String(probe.getDate()).padStart(2, '0')}`;
    if (doctor.availableDays.includes(weekdayOf(s))) {
      found++;
      if (found === skip) return s;
    }
  }
}

// "Dr. Meera Kapoor" -> "meera.kapoor"
const slug = (name) => name.replace(/^Dr\.?\s*/i, '').toLowerCase().replace(/'/g, '').trim().replace(/\s+/g, '.');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_appointments');
  await Promise.all([Department.deleteMany(), Doctor.deleteMany(), Appointment.deleteMany(), User.deleteMany()]);
  await Department.insertMany(departments);
  const docs = await Doctor.insertMany(doctors);

  // ---- demo accounts (passwords are hashed automatically by the User model) ----
  await User.create({ name: 'Hospital Admin', email: 'admin@aarogya.example', password: 'Admin@123', role: 'admin' });
  for (const d of docs) {
    await User.create({ name: d.name, email: `${slug(d.name)}@aarogya.example`, password: 'Doctor@123', role: 'doctor', doctor: d._id });
  }
  const people = [
    ['Aarav Mehta', 'aarav.mehta@example.com', '9876500011'],
    ['Priya Nair', 'priya.nair@example.com', '9876500022'],
    ['Rohan Iyer', 'rohan.iyer@example.com', '9876500033'],
    ['Sneha Kulkarni', 'sneha.k@example.com', '9876500044'],
  ];
  const patients = [];
  for (const [name, email, phone] of people) {
    patients.push(await User.create({ name, email, phone, password: 'Patient@123', role: 'patient' }));
  }

  const reasons = ['Routine checkup', 'Follow-up visit', 'Recurring headache', 'Skin rash', 'Knee pain', 'Chest discomfort'];
  const sample = [];
  docs.slice(0, 6).forEach((doc, i) => {
    patients.forEach((p, j) => {
      if ((i + j) % 2 === 0) {
        sample.push({
          patient: p._id, patientName: p.name, email: p.email, phone: p.phone, doctor: doc._id,
          date: nextWorkingDate(doc, j % 2), time: doc.slots[(j * 2) % doc.slots.length],
          reason: reasons[(i + j) % reasons.length],
          status: j === 3 ? 'Cancelled' : 'Booked',
        });
      }
    });
  });
  const seen = new Set();
  const unique = sample.filter((a) => { const k = `${a.doctor}${a.date}${a.time}`; if (seen.has(k)) return false; seen.add(k); return true; });
  await Appointment.insertMany(unique);

  console.log(`Seeded ${departments.length} departments, ${docs.length} doctors, ${unique.length} appointments.`);
  console.log('\nDemo logins:');
  console.log('  Admin   : admin@aarogya.example / Admin@123');
  console.log(`  Doctor  : ${slug(docs[0].name)}@aarogya.example / Doctor@123   (every doctor uses Doctor@123)`);
  console.log('  Patient : aarav.mehta@example.com / Patient@123   (all demo patients use Patient@123)');
  await mongoose.disconnect();
})().catch((e) => { console.error('Seeding failed:', e.message); process.exit(1); });

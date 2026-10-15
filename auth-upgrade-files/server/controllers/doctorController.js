const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { fail } = require('../utils/dates');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/doctors?search=&specialization=&all=true
exports.listDoctors = async (req, res, next) => {
  try {
    const { search, specialization } = req.query;
    const filter = { isActive: true }; // the public list only shows active doctors
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');
    if (specialization) filter.specialization = specialization;
    res.json(await Doctor.find(filter).sort('name'));
  } catch (e) { next(e); }
};

// GET /api/doctors/all  (admin only) -> includes inactive doctors
exports.listAllDoctors = async (req, res, next) => {
  try { res.json(await Doctor.find().sort('name')); } catch (e) { next(e); }
};

// GET /api/doctors/:id
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) fail(404, 'Doctor not found');
    res.json(doctor);
  } catch (e) { next(e); }
};

// POST /api/doctors  (admin only) -> creates the doctor AND the doctor's login account
exports.addDoctor = async (req, res, next) => {
  try {
    const { loginEmail, loginPassword, ...data } = req.body;
    if (!loginEmail || !loginPassword) fail(400, 'A login email and password for the doctor are required');
    if (await User.findOne({ email: loginEmail.trim().toLowerCase() })) fail(409, 'That login email is already registered');

    const doctor = await Doctor.create(data);
    try {
      await User.create({ name: doctor.name, email: loginEmail, password: loginPassword, role: 'doctor', doctor: doctor._id });
    } catch (err) {
      await Doctor.findByIdAndDelete(doctor._id); // undo, so we never keep a doctor without a login
      throw err;
    }
    res.status(201).json(doctor);
  } catch (e) { next(e); }
};

// PUT /api/doctors/:id  (also used to re-activate a doctor with { isActive: true })
exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) fail(404, 'Doctor not found');
    res.json(doctor);
  } catch (e) { next(e); }
};

// DELETE /api/doctors/:id  -> deactivates (soft delete) so old appointments keep their doctor
exports.deactivateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!doctor) fail(404, 'Doctor not found');
    res.json(doctor);
  } catch (e) { next(e); }
};

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { todayStr, nowTime, isRealDate, weekdayOf, fail } = require('../utils/dates');

// Works out which of a doctor's slots are free on a given date.
// A slot is NOT free if a non-cancelled appointment already uses it (cancelled ones free the slot),
// or if the time has already passed today.
async function getSlots(doctor, date) {
  if (!isRealDate(date)) fail(400, 'Please choose a valid date');
  if (date < todayStr()) fail(400, 'You cannot book an appointment in the past');

  const day = weekdayOf(date);
  if (!doctor.availableDays.includes(day)) {
    return { slots: [], message: `${doctor.name} does not see patients on ${day}s. Available: ${doctor.availableDays.join(', ')}.` };
  }
  const taken = (await Appointment.find({ doctor: doctor._id, date, status: { $ne: 'Cancelled' } }).select('time')).map((a) => a.time);
  const slots = doctor.slots.map((time) => ({
    time,
    available: !taken.includes(time) && !(date === todayStr() && time <= nowTime()),
  }));
  return { slots, message: '' };
}

// GET /api/appointments/slots?doctorId=...&date=YYYY-MM-DD
exports.availableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) fail(400, 'doctorId and date are required');
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) fail(404, 'Doctor not found');
    res.json(await getSlots(doctor, date));
  } catch (e) { next(e); }
};

// POST /api/appointments  -> the main booking logic (all checks happen here on the server)
exports.bookAppointment = async (req, res, next) => {
  try {
    // Name and email come from the logged-in account, NOT from the form, so nobody can book as someone else
    const { doctor: doctorId, date, time, reason } = req.body;
    const phone = req.body.phone || req.user.phone;
    if (!phone || !doctorId || !date || !time) fail(400, 'Phone, doctor, date and time slot are all required');
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) fail(404, 'This doctor is not available for booking');

    const { slots, message } = await getSlots(doctor, date); // also rejects past dates
    if (message) fail(400, message);
    const slot = slots.find((s) => s.time === time);
    if (!slot) fail(400, "That is not one of the doctor's time slots");
    if (!slot.available) fail(409, 'Sorry, that time slot is already booked or has passed. Please pick another.');

    const appointment = await Appointment.create({
      patient: req.user._id, patientName: req.user.name, email: req.user.email,
      phone, doctor: doctorId, date, time, reason,
    });
    res.status(201).json(await appointment.populate('doctor', 'name specialization fee'));
  } catch (e) { next(e); }
};

// GET /api/appointments?doctorId=&status=
// Patients see only their own, doctors only their own patients', admins see everything.
exports.listAppointments = async (req, res, next) => {
  try {
    const { doctorId, status } = req.query;
    const filter = {};
    if (req.user.role === 'patient') filter.patient = req.user._id;
    else if (req.user.role === 'doctor') filter.doctor = req.user.doctor;
    else if (doctorId) filter.doctor = doctorId; // admin filter
    if (status) filter.status = status;
    const items = await Appointment.find(filter).populate('doctor', 'name specialization').sort({ date: 1, time: 1 });
    res.json(items);
  } catch (e) { next(e); }
};

// PATCH /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) fail(404, 'Appointment not found');
    if (req.user.role === 'patient' && String(appt.patient) !== String(req.user._id)) fail(403, 'You can only cancel your own appointments');
    if (appt.status !== 'Booked') fail(400, `A ${appt.status.toLowerCase()} appointment cannot be cancelled`);
    appt.status = 'Cancelled';
    await appt.save();
    res.json(await appt.populate('doctor', 'name specialization'));
  } catch (e) { next(e); }
};

// PATCH /api/appointments/:id/status  body: { status: "Completed" | "Cancelled" }
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Completed', 'Cancelled'].includes(status)) fail(400, 'Status must be Completed or Cancelled');
    const appt = await Appointment.findById(req.params.id);
    if (!appt) fail(404, 'Appointment not found');
    if (req.user.role === 'doctor' && String(appt.doctor) !== String(req.user.doctor)) fail(403, 'You can only update your own appointments');
    if (appt.status === 'Cancelled') fail(400, 'A cancelled appointment cannot be changed');
    appt.status = status;
    await appt.save();
    res.json(await appt.populate('doctor', 'name specialization'));
  } catch (e) { next(e); }
};

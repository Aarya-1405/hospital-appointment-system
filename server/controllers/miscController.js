const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { todayStr } = require('../utils/dates');

// GET /api/departments
exports.listDepartments = async (req, res, next) => {
  try { res.json(await Department.find().sort('name')); } catch (e) { next(e); }
};

// GET /api/stats  -> every number is counted live from MongoDB
exports.dashboardStats = async (req, res, next) => {
  try {
    const [totalDoctors, totalAppointments, upcoming, completed, cancelled] = await Promise.all([
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Booked', date: { $gte: todayStr() } }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
    ]);
    res.json({ totalDoctors, totalAppointments, upcoming, completed, cancelled });
  } catch (e) { next(e); }
};

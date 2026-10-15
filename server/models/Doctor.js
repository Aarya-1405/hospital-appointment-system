const mongoose = require('mongoose');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Doctor name is required'], trim: true },
    specialization: { type: String, required: [true, 'Specialization is required'], trim: true },
    qualifications: { type: String, required: [true, 'Qualifications are required'], trim: true },
    experience: { type: Number, required: [true, 'Experience is required'], min: [0, 'Experience cannot be negative'] },
    fee: { type: Number, required: [true, 'Consultation fee is required'], min: [0, 'Fee cannot be negative'] },
    availableDays: {
      type: [{ type: String, enum: DAYS }],
      validate: [(v) => v.length > 0, 'Select at least one available day'],
    },
    slots: {
      type: [{ type: String, match: [/^\d{2}:\d{2}$/, 'Slots must look like 09:30'] }],
      validate: [(v) => v.length > 0, 'Select at least one time slot'],
    },
    bio: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }, // "delete" in the admin panel just sets this to false
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);

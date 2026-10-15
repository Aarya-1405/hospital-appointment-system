const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Patient account is required'] },
    patientName: { type: String, required: [true, 'Patient name is required'], trim: true, maxlength: 80 },
    email: {
      type: String, required: [true, 'Email is required'], trim: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String, required: [true, 'Phone number is required'], trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number (7-15 digits)'],
    },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: [true, 'Doctor is required'] },
    date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    time: { type: String, required: [true, 'Time slot is required'], match: [/^\d{2}:\d{2}$/, 'Time must be HH:MM'] },
    reason: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: ['Booked', 'Completed', 'Cancelled'], default: 'Booked' },
  },
  { timestamps: true }
);

// Speeds up the "is this slot taken?" query
appointmentSchema.index({ doctor: 1, date: 1, time: 1 });
appointmentSchema.index({ patient: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

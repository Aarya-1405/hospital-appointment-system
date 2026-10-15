const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// One collection for every kind of account. "role" decides what the person may do.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, match: [/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number (7-15 digits)'] },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, // only for role = doctor
  },
  { timestamps: true }
);

// Before saving, replace the plain password with a one-way hash. The real password is never stored.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);

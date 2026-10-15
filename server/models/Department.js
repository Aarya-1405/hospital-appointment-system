const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Stethoscope' }, // name of a lucide-react icon, used by the frontend
});

module.exports = mongoose.model('Department', departmentSchema);

// Connects to MongoDB using the address in server/.env
const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_appointments';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', mongoose.connection.name);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Is MongoDB running? Check README.md > Troubleshooting.');
    process.exit(1);
  }
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/dates');

const makeToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });

// What the frontend is allowed to know about a user (never the password)
const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role,
  doctor: u.doctor?._id || u.doctor,
});

// POST /api/auth/register  -> public sign-up. Always creates a PATIENT (doctors/admins cannot self-register).
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.create({ name, email, phone: phone || undefined, password, role: 'patient' });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) fail(400, 'Enter your email and password');
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password').populate('doctor', 'isActive');
    // same message for "no such user" and "wrong password" so attackers learn nothing
    if (!user || !(await user.checkPassword(password))) fail(401, 'Incorrect email or password');
    if (user.role === 'doctor' && !user.doctor?.isActive) fail(403, 'This doctor account has been deactivated');
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
};

// GET /api/auth/me -> who am I? (used when the page reloads)
exports.me = (req, res) => res.json(publicUser(req.user));

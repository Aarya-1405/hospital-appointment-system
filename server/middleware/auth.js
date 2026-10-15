const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/dates');

// 1) protect: the request must carry a valid login token ("Authorization: Bearer <token>")
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) fail(401, 'Please log in to continue');

    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { fail(401, 'Your session has expired. Please log in again.'); }

    const user = await User.findById(payload.id);
    if (!user) fail(401, 'This account no longer exists');
    req.user = user; // controllers can now use req.user
    next();
  } catch (e) { next(e); }
};

// 2) allowRoles('admin'): only these roles may continue (use after protect)
exports.allowRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) return next();
  const e = new Error('You do not have permission to do this');
  e.status = 403;
  next(e);
};

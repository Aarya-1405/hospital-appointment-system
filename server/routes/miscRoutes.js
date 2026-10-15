const router = require('express').Router();
const c = require('../controllers/miscController');
const { protect, allowRoles } = require('../middleware/auth');

router.get('/departments', c.listDepartments);                          // public
router.get('/stats', protect, allowRoles('admin'), c.dashboardStats);   // admin only

module.exports = router;

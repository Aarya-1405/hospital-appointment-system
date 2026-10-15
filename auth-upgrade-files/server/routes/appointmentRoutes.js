const router = require('express').Router();
const c = require('../controllers/appointmentController');
const { protect, allowRoles } = require('../middleware/auth');

router.use(protect); // every appointment route needs a logged-in user

router.get('/slots', c.availableSlots);
router.get('/', c.listAppointments); // the controller shows each role only what it may see
router.post('/', allowRoles('patient'), c.bookAppointment);
router.patch('/:id/cancel', allowRoles('patient', 'admin'), c.cancelAppointment);
router.patch('/:id/status', allowRoles('doctor', 'admin'), c.updateStatus);

module.exports = router;

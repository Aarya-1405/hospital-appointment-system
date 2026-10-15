const router = require('express').Router();
const c = require('../controllers/doctorController');
const { protect, allowRoles } = require('../middleware/auth');

// Public: anyone can browse active doctors
router.get('/', c.listDoctors);
// Admin only (must come before "/:id")
router.get('/all', protect, allowRoles('admin'), c.listAllDoctors);
router.post('/', protect, allowRoles('admin'), c.addDoctor);

router.get('/:id', c.getDoctor);
router.put('/:id', protect, allowRoles('admin'), c.updateDoctor);
router.delete('/:id', protect, allowRoles('admin'), c.deactivateDoctor);

module.exports = router;

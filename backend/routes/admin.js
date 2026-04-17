const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// All admin routes require auth + admin role
router.use(auth, roles('admin'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getAllUsers);
router.get('/providers', ctrl.getAllProviders);
router.get('/providers/pending', ctrl.getPendingProviders);
router.get('/jobs', ctrl.getAllJobs);
router.get('/categories', ctrl.getCategories);
router.get('/locations', ctrl.getLocations);
router.get('/notifications', ctrl.getNotifications);
router.post('/verify-provider', ctrl.verifyProvider);
router.patch('/users/:user_id/toggle', ctrl.toggleUser);

module.exports = router;

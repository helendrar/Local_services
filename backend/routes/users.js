const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const auth   = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// Own profile (specific paths — must come before /:id)
router.get('/me',                        ctrl.getMe);
router.put('/me',                        ctrl.updateMe);
router.get('/me/activity',               ctrl.getMyActivity);

// Notifications (specific paths)
router.get('/notifications',             ctrl.getNotifications);
router.patch('/notifications/read-all',  ctrl.markNotificationsRead);
router.delete('/notifications/:id',      ctrl.deleteNotification);

// Digital ID lookup (specific path prefix)
router.get('/lookup/:digital_id',        ctrl.lookupDigitalId);

// Dynamic :id route — MUST be last
router.get('/:id',                       ctrl.getUserById);

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const auth   = require('../middleware/auth');

// All notification routes require auth
router.use(auth);

router.get('/',              ctrl.getAll);
router.get('/unread-count',  ctrl.getUnreadCount);
router.patch('/read-all',    ctrl.markAllRead);
router.patch('/:id/read',    ctrl.markOneRead);
router.delete('/clear-all',  ctrl.deleteAll);
router.delete('/:id',        ctrl.deleteOne);

module.exports = router;

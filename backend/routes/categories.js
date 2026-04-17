const router = require('express').Router();
const ctrl   = require('../controllers/categoryController');
const auth   = require('../middleware/auth');
const roles  = require('../middleware/roles');

// Public
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);

// Admin only
router.post('/',    auth, roles('admin'), ctrl.create);
router.put('/:id',  auth, roles('admin'), ctrl.update);
router.delete('/:id', auth, roles('admin'), ctrl.remove);

module.exports = router;

const router   = require('express').Router();
const authCtrl = require('../controllers/authController');
const auth     = require('../middleware/auth');

router.post('/register',        authCtrl.register);
router.post('/login',           authCtrl.login);
router.get('/me',      auth,    authCtrl.getMe);
router.put('/change-password', auth, authCtrl.changePassword);

module.exports = router;

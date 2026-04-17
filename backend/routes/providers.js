const router = require('express').Router();
const ctrl   = require('../controllers/providerController');
const auth   = require('../middleware/auth');
const roles  = require('../middleware/roles');
const upload = require('../middleware/upload');

// Specific routes MUST come before /:id route
router.get('/',                     ctrl.getProviders);
router.get('/my-profile',           auth, roles('provider'), ctrl.getMyProfile);
router.put('/profile',              auth, roles('provider'), ctrl.updateProfile);
router.post('/upload-document',     auth, roles('provider'), upload.single('document'), ctrl.uploadDocument);

// Dynamic :id route must be LAST
router.get('/:id',                  ctrl.getProviderById);

module.exports = router;

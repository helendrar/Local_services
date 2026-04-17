const router = require('express').Router();
const ctrl = require('../controllers/ratingController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

router.post('/', auth, roles('customer'), ctrl.submitRating);
router.get('/provider/:id', ctrl.getProviderRatings);

module.exports = router;

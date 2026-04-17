const router = require('express').Router();
const ctrl   = require('../controllers/jobController');
const auth   = require('../middleware/auth');
const roles  = require('../middleware/roles');

// Specific routes first
router.get('/open',                  auth,                      ctrl.getOpenJobs);
router.get('/mine',                  auth, roles('customer'),   ctrl.getMyJobs);
router.get('/assigned',              auth, roles('provider'),   ctrl.getAssignedJobs);
router.post('/',                     auth, roles('customer'),   ctrl.postJob);
router.post('/assign',               auth, roles('customer'),   ctrl.assignJob);
router.post('/respond',              auth, roles('provider'),   ctrl.respondToJob);
router.patch('/:job_id/complete',    auth, roles('customer'),   ctrl.completeJob);

// Dynamic :id route must be LAST
router.get('/:id',                   auth,                      ctrl.getJobById);

module.exports = router;

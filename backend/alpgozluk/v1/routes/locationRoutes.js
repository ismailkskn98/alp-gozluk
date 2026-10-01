const express = require('express');
const controller = require('../controllers/locationController');
const { createRateLimit } = require('../middlewares/rateLimit');

const router = express.Router();
const locationRateLimit = createRateLimit({
  namespace: 'public-locations',
  max: 240,
  windowSeconds: 60,
});

router.use(locationRateLimit);
router.get('/provinces', controller.listProvinces);
router.get('/provinces/:provinceId/districts', controller.listDistricts);
router.get('/districts/:districtId/neighborhoods', controller.listNeighborhoods);

module.exports = router;

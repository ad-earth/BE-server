const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');
const middleware = require('../middlewares/admin-middleware');

router
  .get('/ad-report', middleware, reportController.getKeywordReport)
  .get('/sales-report', middleware, reportController.getProductReport);

module.exports = router;

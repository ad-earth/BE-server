const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrder');
const middleware = require('../middlewares/admin-middleware');

router
  .get('/', middleware, adminOrderController.getAdminOrders) // 배송관리 조회
  .put('/', middleware, adminOrderController.updateOrdersStatus); // 배송상태 변경

module.exports = router;

const express = require('express');
const router = express.Router();
const adminMainController = require('../controllers/adminMain');
const middleware = require('../middlewares/admin-middleware');

router
  .get('/new-orders', middleware, adminMainController.getNewOrders) // 신규 주문 수
  .get('/on-products', middleware, adminMainController.getOnProducts) // 노출중인 상품 수
  .get('/last-sales', middleware, adminMainController.getLastSales) // 전월 매출액
  .get('/popular-keywords', middleware, adminMainController.getPopularKeywords) // 인기 키워드 10
  .get('/expense-reports', middleware, adminMainController.getExpenseReports) // 광고 요약 보고서
  .get('/charge', middleware, adminMainController.getCharge) // 광고비 조회
  .put('/charge', middleware, adminMainController.updateCharge); // 광고비 충전

module.exports = router;

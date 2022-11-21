const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const middleware = require('../middlewares/admin-middleware');

router
  .post('/', middleware, productController.createProduct) // 등록
  .get('/', middleware, productController.getProducts) // 전체 및 카테고리 조회
  .get('/list', middleware, productController.getProductsList) // 목록 드롭
  .get('/:p_No', middleware, productController.getProductDetail) // 상세 정보
  .put('/status/:p_No', middleware, productController.updateProductStatus) // 노출 상태 변경
  .put('/:p_No', middleware, productController.updateProductInfo) // 정보 수정
  .delete('/', middleware, productController.deleteProducts); // 삭제

module.exports = router;

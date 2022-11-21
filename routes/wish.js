const express = require('express');
const router = express.Router();
const wishController = require('../controllers/wish');
const middleware = require('../middlewares/client-middleware');

router
  .get('/', middleware, wishController.getWishes) // 위시리스트 조회
  .post('/:p_No', middleware, wishController.createWish); // 위시리스트 생성

module.exports = router;

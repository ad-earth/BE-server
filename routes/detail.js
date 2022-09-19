const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Wish = require('../schemas/wishes');
const Keyword = require('../schemas/keywords');
const User = require('../schemas/users');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.U_TOKEN;

/** 상품 정보 조회 */
router.get('/:p_No', async (req, res) => {
  const { p_No } = req.params;
  const { keyword } = req.query;

  let k_No = 0;
  if (keyword) {
    // db.expense 현재 키워드, 키워드번호, 입찰금 생성 및 charge 금액 차감
    // keyword db의 현재 키워드 클릭수 +1
    // 키워드 번호
  }
  try {
    let product = await Product.findOne(
      { p_No, p_Status: true },
      { _id: 0, a_Idx: 0, createdAt: 0, p_Price: 0, __v: 0, p_Status: 0 },
    ).exec();

    /** 게시물에 좋아요를 누른 유저 */
    let userLike = 'false';
    const { authorization } = req.headers;

    if (!authorization) {
      /** header에 token이 없으면 */
      userLike = 'false';
    } else {
      /** header에 token이 있으면 */
      const [tokenType, tokenValue] = (authorization || '').split(' ');
      const { u_Idx } = jwt.verify(tokenValue, jwtKey);
      let idx = u_Idx;

      let wishUser = await Wish.find({
        u_Idx: idx,
        p_No: product.p_No,
      });

      if (wishUser.length > 0) {
        userLike = 'true';
      } else {
        userLike = 'false';
      }
    }

    /** like 가공 */
    if (product.p_Like > 0) {
      product.p_Best = true;
    } else {
      product.p_Best = false;
    }

    res.status(200).json({
      userLike: userLike,
      k_No,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});
module.exports = router;
const express = require('express');
const router = express.Router();
const Admin = require('../schemas/admins');
const Product = require('../schemas/products');
const auth = require('../middlewares/admin-middleware');
const fnc = require('../functions/noCreate');

/** 상품등록 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
    } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const a_Brand = admin.a_Brand;

    /** 판매자 번호 확인 및 생성 (보류) */
    const recentNo = await Product.find().sort('-p_No').limit(1);
    let p_No = 1; // 상품당 옵션 부가번호
    if (recentNo.length !== 0) {
      p_No = recentNo[0]['p_No'] + 1;
    }

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..*/, '');

    /** soldout */
    let p_Soldout = false;

    await Product.create({
      p_No,
      a_Idx,
      p_Category,
      p_Thumbnail,
      a_Brand,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
      p_Soldout,
      createdAt,
    });

    res.status(201).send({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      errorMessage: '상품 등록 실패',
    });
  }
});

module.exports = router;

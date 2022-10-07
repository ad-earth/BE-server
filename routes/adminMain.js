const express = require('express');
const router = express.Router();
const auth = require('../middlewares/admin-middleware');
const Product = require('../schemas/products');

/** 신규주문 */
/** 노출 상품 수 */
router.get('/on-products', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let productsCnt = await Product.find({ a_Idx, p_Status: true }).count();

    res.status(200).json({
      productsCnt,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
});
/** 전월 매출액 */
/** 광고 키워드 순위 10 */
/** 광고 요약 보고서 */

module.exports = router;

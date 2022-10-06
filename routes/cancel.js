const express = require('express');
const router = express.Router();
const auth = require('../middlewares/user-middleware');
const CancelProd = require('../schemas/cancelProd');

/** 취소 상품 조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost } = req.query;

    /** maxpost 수만큼 page 처리 */
    Number(page, maxpost);
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;
    let cnt = await CancelProd.find({ u_Idx }).count();

    let db = await CancelProd.find({ u_Idx }).limit(maxpost).skip(skipCnt);
    let objList = {};
    let cancelList = [];
    for (let x in db) {
      let date = db[x].createdAt
        .toISOString()
        .replace('T', ' ')
        .substring(0, 10);
      objList = {
        o_No: db[x].o_No,
        o_Date: date,
        o_Price: db[x].o_Price,
        products: db[x].products,
      };
      cancelList.push(objList);
    }
    res.status(200).json({
      cnt,
      cancelList,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;

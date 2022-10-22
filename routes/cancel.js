const express = require('express');
const router = express.Router();
const auth = require('../middlewares/user-middleware');
const CancelProd = require('../schemas/cancelProd');

/** 취소 상품 조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost } = req.query;

    page = Number(page);
    maxpost = Number(maxpost);

    /** maxpost 수만큼 page 처리 */
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** 전체 게시물 수 */
    let cnt = await CancelProd.find({ u_Idx }).count();

    let cancelList = [];
    if (cnt == 0) {
      cancelList = [];
    } else {
      let db = await CancelProd.find({ u_Idx }).limit(maxpost).skip(skipCnt);
      let objList = {};
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
    }

    return res.status(200).send({
      cnt,
      cancelList,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

module.exports = router;

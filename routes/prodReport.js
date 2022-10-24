const express = require('express');
const router = express.Router();
const auth = require('../middlewares/admin-middleware');
const SalesProduct = require('../schemas/salesProducts');

/** 상품 보고서 */
router.get('/', auth, async (req, res) => {
  try {
    let { date, p_Category } = req.query;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** date 처리 */
    let startDate = Date;
    let start = '';
    let endDate = Date;
    let end = '';
    let objMatch = {};

    if (date == 'null' && p_Category == 'null') {
      /** 현재 시간 */
      let now = new Date(+new Date() + 3240 * 10000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 10);

      /** 하루 전 */
      startDate = new Date(now);
      start = new Date(startDate);
      endDate = new Date(now);
      end = new Date(endDate);

      start.setDate(startDate.getDate() - 1);
      end.setDate(endDate.getDate());

      objMatch = { a_Idx, createdAt: { $gte: start, $lte: end } };
    } else if (date == 'null' && p_Category != 'null') {
      // p_Category
      objMatch = { a_Idx, p_Category };
    } else if (date != 'null' && p_Category == 'null') {
      // date
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objMatch = { a_Idx, createdAt: { $gte: start, $lte: end } };
    } else {
      // p_Category, date
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objMatch = { a_Idx, p_Category, createdAt: { $gte: start, $lte: end } };
    }

    let data = await SalesProduct.aggregate([
      { $match: objMatch },
      {
        $group: {
          _id: { p_No: '$p_No', p_Category: '$p_Category', p_Name: '$p_Name' },
          p_Cnt: { $sum: '$p_Cnt' },
          p_Price: { $sum: '$p_Price' },
        },
      },
    ]);

    /** 총 금액 */
    let totalPrice = 0;

    let objData = {};
    let products = [];
    for (let a in data) {
      objData = {
        p_No: data[a]._id.p_No,
        p_Name: data[a]._id.p_Name,
        p_Cnt: data[a].p_Cnt,
        p_Price: data[a].p_Price,
      };
      totalPrice += objData.p_Price;
      products.push(objData);
    }

    /** 전체 수 */
    let cnt = products.length;

    return res.status(200).send({
      cnt,
      totalPrice,
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});
module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/admin-middleware');
const SalesKeyword = require('../schemas/salesKeywords');

/** 키워드 보고서 */
router.get('/', auth, async (req, res) => {
  try {
    let { date, p_No } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** date 처리 */
    let start = new Date(date[0]);
    let endDate = new Date(date[1]);
    let end = new Date(endDate);
    end.setDate(endDate.getDate() + 1);

    let data = await SalesKeyword.aggregate([
      { $match: { a_Idx, p_No, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { p_No: '$p_No', keyword: '$keyword' },
          k_Click: { $sum: '$k_Click' },
          k_Cost: { $sum: '$k_Cost' },
          k_Trans: { $sum: '$k_Trans' },
          p_Price: { $sum: '$p_Price' },
        },
      },
    ]);

    let objData = {};
    let list = [];
    for (let a in data) {
      objData = {
        keyword: data[a]._id.keyword,
        k_Click: data[a].k_Click,
        k_Cost: data[a].k_Cost,
        k_Trans: data[a].k_Trans,
        p_Price: data[a].p_Price,
      };
      list.push(objData);
    }

    /** 전체 수 */
    let cnt = list.length;

    res.status(200).json({
      cnt,
      list,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
});
module.exports = router;
const express = require('express');
const router = express.Router();
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/admin-middleware');

/** 예상 순위 및 금액 조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { p_No, keyword, k_Level } = req.query;

    p_No = Number(p_No);
    k_Level = Number(k_Level);

    /** 내 상품 제외하고 광고중인 키워드 있는지 확인 */
    let findKeyword = await Keyword.find(
      { keyword, k_Status: 'on', p_No: { $ne: p_No } },
      { _id: 0, __v: 0, createdAt: 0 },
    ).exec();

    let k_Cost = 0;
    if (findKeyword.length == 0) {
      /** 광고중인 키워드가 없다면 90원 반환 */
      k_Cost = 90;
    } else {
      /** 광고중인 키워드가 있다면 */
      for (let a in findKeyword) {
        if (findKeyword[a].k_Level == k_Level) {
          /** 예상 순위와 같은 키워드가 있으면 +10 반환 */
          k_Cost = findKeyword[a].k_Cost + 10;
          break;
        } else if (k_Level == 1 && findKeyword[a].k_Level == 2) {
          /** 예상 순위가 1위이면 한 순위 낮은 광고 확인 후 입찰가 +10 */
          k_Cost = findKeyword[a].k_Cost + 10;
          break;
        } else if (
          k_Level != 1 &&
          k_Level != 4 &&
          k_Level - 1 == findKeyword[a].k_Level
        ) {
          /** 한 순위 높은 광고 있나 확인 후 그 순위 입찰가 -10 반환 */
          k_Cost = findKeyword[a].k_Cost - 10;
          break;
        } else {
          /** 예상 순위가 4위이면 90원 반환 */
          k_Cost = 90;
          continue;
        }
      }
    }

    return res.status(200).send({
      k_Cost,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/admin-middleware');

//-- 예상 순위 및 금액 조회
router.get('/', auth, async (req, res) => {
  try {
    let { p_No, keyword, k_Level } = req.query;

    p_No = Number(p_No);
    k_Level = Number(k_Level);

    // 내 상품 제외하고 광고중인 키워드 있는지 확인
    let findKeyword = await Keyword.find(
      { keyword, k_Status: true, p_No: { $ne: p_No } },
      { _id: 0, __v: 0, createdAt: 0 },
    )
      .sort('k_Level')
      .exec();
    console.log('findKeyword: ', findKeyword);

    let levelCost = 0;

    if (!findKeyword.length) {
      // 광고중인 키워드가 없다면 90원
      levelCost = 90;
      console.log('광고중인 키워드가 없다면 90원');
    } else {
      // 광고중인 키워드가 있다면
      for (let a in findKeyword) {
        if (k_Level == findKeyword[a].k_Level) {
          // 예상 순위와 같은 키워드가 있으면 +10 반환
          levelCost = findKeyword[a].k_Cost + 10;
          console.log('예상 순위와 같은 키워드가 있으면 +10 반환');
          break;
        } else if (k_Level <= 3 && k_Level + 1 == findKeyword[a].k_Level) {
          // 한 순위 낮은 광고 있나 확인 후 그 순위 입찰가 +10 반환
          // 4위를 1순위 낮추면 5위인데 없는 순위라 1~3위만 해당
          levelCost = findKeyword[a].k_Cost + 10;
          console.log('1~3위 1순위 내렸을 때 결과 존재하면 그 결과의 +10 반환');
          break;
        } else if (k_Level <= 2 && k_Level + 2 == findKeyword[a].k_Level) {
          // 3,4위를 2순위 낮추면 5,6위인데 없는 순위라 1,2위만 해당
          levelCost = findKeyword[a].k_Cost + 10;
          console.log('1,2위 2순위 내렸을 때 결과 존재하면 그 결과의 +10 반환');
          break;
        } else if (k_Level <= 1 && k_Level + 3 == findKeyword[a].k_Level) {
          // 2~4위를 3순위 낮추면 5~7위인데 없는 순위라 1위만 해당
          levelCost = findKeyword[a].k_Cost + 10;
          console.log('1위 3순위 내렸을 때 결과 존재하면 그 결과의 +10 반환');
          break;
        } else {
          // 해당 순위보다 낮은 순위로 등록된 광고는 없고 높은 순위의 광고만 존재할때
          levelCost = 90;
          console.log(
            '해당 순위보다 낮은 순위로 등록된 광고는 없고 높은 순위의 광고만 존재할때',
          );
        }
      }
    }

    console.log('levelCost: ', levelCost);

    return res.status(200).send({
      levelCost,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

module.exports = router;

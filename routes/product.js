const express = require('express');
const router = express.Router();
const Admin = require('../schemas/admins');
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/admin-middleware');
const { bool } = require('joi');

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
      p_Content,
    } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const a_Brand = admin.a_Brand;

    /** 판매자 번호 확인 및 생성 (보류) */
    const recentNo = await Product.find().sort('-p_No').limit(1);
    let p_No = 1001; // 상품당 옵션 부가번호
    if (recentNo.length !== 0) {
      p_No = recentNo[0]['p_No'] + 1;
    }

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

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
      p_Content,
      createdAt,
    });

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 전체 및 카테고리 상품 조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost, p_Category } = req.query;
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** page처리 */
    page = Number(page);
    maxpost = Number(maxpost);

    let cnt = 0;
    page == 1 ? (cnt = 0) : (cnt = page * maxpost - maxpost);

    let findData = {};
    if (p_Category.length != 0) {
      /** 카테고리별 상품 */
      findData = { a_Idx, p_Category };
    } else {
      /** 전체 상품 */
      findData = { a_Idx };
    }

    let list = await Product.find(findData, {
      _id: 0,
      p_No: 1,
      p_Category: 1,
      p_Name: 1,
      p_Status: 1,
    })
      .sort()
      .limit(maxpost)
      .skip(cnt);

    /** 총 상품 수 */
    cnt = await Product.find(findData).count();

    res.status(200).json({
      cnt,
      list,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 상품 노출 여부 */
router.put('/status/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No },
      { _id: 0, a_Idx: 1, p_Status: 1 },
    ).exec();

    let status = bool;

    if (a_Idx == db.a_Idx) {
      if (db.p_Status == true) {
        status = false;
      } else {
        status = true;
      }
      await Product.updateOne(
        { p_No },
        {
          $set: {
            p_Status: status,
          },
        },
      );
      return res.status(201).json({
        success: true,
      });
    } else {
      return res.status(401).json({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
    });
  }
});

/** 상품수정 */
router.put('/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;
    const {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
      p_Content,
    } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();

    /** token과 param의 a_Idx 일치하는지 확인 */
    if (a_Idx == db.a_Idx) {
      await Product.updateOne(
        { p_No },
        {
          $set: {
            p_Category,
            p_Thumbnail,
            p_Name,
            p_Cost,
            p_Sale,
            p_Discount,
            p_Option,
            p_Desc,
            p_Content,
          },
        },
      );
      return res.status(201).json({
        success: true,
      });
    } else {
      return res.status(401).json({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
    });
  }
});

/** 상품삭제 */
router.delete('/', auth, async (req, res) => {
  try {
    const { p_No } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No: p_No[0] },
      { _id: 0, a_Idx: 1 },
    ).exec();

    if (a_Idx == db.a_Idx) {
      for (let i = 0; i < p_No.length; i++) {
        await Product.deleteOne({ p_No: p_No[i] });
      }
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(401).json({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 상품 목록 드롭 */
router.get('/list', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    const productList = await Product.find(
      { a_Idx },
      { _id: 0, p_No: 1, p_Name: 1 },
    ).exec();
    if (productList.length != 0) {
      res.status(200).json({
        productList,
      });
      return;
    } else {
      res.status(204).json({
        message: '상품을 등록해주세요',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 드롭 상품 선택 */
router.get('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let before = await Keyword.find(
      { p_No, a_Idx },
      { _id: 0, keyword: 1 },
    ).exec();

    res.status(200).json({
      before,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 키워드 추가 */
router.post('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;
    const { keyword } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** 기존에 등록된 키워드가 있는지 */
    let db = await Keyword.find({ keyword, p_No }).exec();

    /** 등록된 키워드가 20개이면 등록 불가 */
    let cnt = await Keyword.find({ p_No }).count();
    if (cnt >= 20) {
      res.status(400).json({
        success: false,
        errorMessage: '키워드 등록 불가',
      });
      return;
    }

    /** 현재 키워드로 등록된 키워드가 없다면 */
    if (db.length == 0) {
      const recentNo = await Keyword.find().sort('-k_No').limit(1);
      let k_No = 1;
      if (recentNo.length !== 0) {
        k_No = recentNo[0]['k_No'] + 1;
      }

      /** 날짜 생성 */
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      /** 키워드 광고 상태 */
      const k_Status = 'off';

      await Keyword.create({
        k_No,
        p_No,
        keyword,
        k_Status,
        createdAt,
      });

      res.status(201).json({
        success: true,
        message: 'post success',
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        errorMessage: '이미 등록된 키워드입니다.',
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '키워드 등록 실패',
    });
  }
});

/** 키워드 삭제 */
router.delete('/:p_No/keywords/:keyword', auth, async (req, res) => {
  try {
    const { p_No, keyword } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    const db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();
    const dbIdx = db.a_Idx;

    if (dbIdx === a_Idx) {
      await Keyword.deleteOne({ p_No, keyword });
      res.status(200).json({
        success: true,
        message: 'delete success',
      });
      return;
    } else {
      res.status(401).json({
        success: false,
        errorMessage: '권한 없음',
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 예상 순위 */
router.get(
  '/:p_No/keywords/:keyword/level/:k_Level',
  auth,
  async (req, res) => {
    try {
      // 상품번호, 키워드, 예상 순위 param으로 받음
      let { p_No, keyword, k_Level } = req.params;

      let k_Status = 'on';
      // db.keyword에서 광고중인 키워드있는지 확인
      let findKeyword = await Keyword.find(
        {
          keyword,
          k_Status,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      let k_Cost = 0;
      // 광고중인 키워드가 없다면 1위 90원 반환
      if (findKeyword.length === 0) {
        k_Cost = 90;
        res.status(200).json({
          k_Cost,
        });
        return;
      }
      // 광고중인 다른 키워드가 있다면 순위 가져옴
      // 그 순위로 광고중인 키워드가 있나 확인
      let level = await Keyword.findOne(
        {
          keyword,
          k_Status,
          k_Level: k_Level,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      // 있다면 입찰가 +10 반환
      if (level != null) {
        k_Cost = level.k_Cost + 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // level이 1이면 한 순위 낮은 광고 확인
      if (k_Level == 1) {
        level = await Keyword.findOne(
          {
            keyword,
            k_Status,
          },
          { _id: 0, k_Level: 1, k_Cost: 1 },
        )
          .sort('k_Level')
          .exec();
        k_Cost = level.k_Cost + 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // level이 4이면
      if (k_Level == 4) {
        level = await Keyword.findOne(
          {
            keyword,
            k_Status,
          },
          { _id: 0, k_Level: 1, k_Cost: 1 },
        )
          .sort('k_Level')
          .exec();
        k_Cost = 90;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // 없으면 한 순위 높은 광고 있나 확인(대신 원하는 순위가 1위일때는 2위 키워드)
      k_Level = Number(k_Level) - 1;

      level = await Keyword.findOne(
        {
          keyword,
          k_Status,
          k_Level: k_Level,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      if (level != null) {
        k_Cost = level.k_Cost - 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }
    } catch (error) {
      res.status(400).json({
        success: false,
      });
    }
  },
);

/** 광고 등록 */
router.put('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;
    const { add } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let adminCharge = await Admin.findOne(
      { a_Idx },
      { _id: 0, a_Charge: 1 },
    ).exec();

    for (let a = 0; a < add.length; a++) {
      let levelCost = await Keyword.findOne(
        {
          p_No: { $ne: p_No },
          keyword: add[a].keyword,
          k_Level: add[a].k_Level,
          k_Status: 'on',
        },
        { _id: 0, p_No: 1, k_Level: 1, k_Cost: 1, k_Status: 1, k_No: 1 },
      ).exec();

      if (adminCharge.a_Charge <= add[a].k_Cost && add[a].k_Status == 'on') {
        /** 입찰금이 충전금보다 가격이 낮거나 같으면 errorMessage 반환 */
        res.status(400).json({
          errorMessage: '충전금이 부족합니다.',
        });
        return;
      } else if (
        levelCost != null &&
        levelCost.k_Cost >= add[a].k_Cost &&
        add[a].k_Status == 'on'
      ) {
        let failKeyword = add[a].keyword;
        let failCost = add[a].k_Cost;
        /**입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환 */
        res.status(400).json({
          errorMessage: `키워드 ${failKeyword}의 입찰금 ${failCost}원은 순위에 맞는 입찰금이 아닙니다.`,
        });
        return;
      } else if (add[a].k_Status == 'off') {
        /** k_Status = "off"면 on > off로 수정*/
        await Keyword.updateOne(
          { p_No, keyword: add[a].keyword },
          { $set: { k_Status: 'off' } },
        );
      } else {
        /** 원하는 순위가 현재 비어있는 순위인지 확인 */
        if (levelCost == null) {
          /** 빈 순위이면 광고 등록 */
          let emptyLevel = await Keyword.updateOne(
            { p_No, keyword: add[a].keyword },
            {
              $set: {
                k_Level: add[a].k_Level,
                k_Cost: add[a].k_Cost,
                k_Status: 'on',
              },
            },
          );
        } else {
          /** 입찰금이 기존 입찰금보다 높으며, 같은 순위이면 기존 순위를 +1 하여 순위 하락 */

          let downLevel = levelCost.k_Level;

          let sameLevel = await Keyword.find(
            {
              p_No: { $ne: p_No },
              keyword: add[a].keyword,
              k_Level: downLevel + 1,
              k_Status: 'on',
            },
            { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
          ).exec();

          if (sameLevel.length == 0) {
            /** 순위를 하락했을 때 중복 순위가 없다면 */
            if (downLevel == 4) {
              let offStatus = 'off';
              await Keyword.updateOne(
                {
                  k_No: levelCost.k_No,
                },
                {
                  $set: {
                    k_Level: downLevel + 1,
                    k_Status: offStatus,
                  },
                },
              );
            } else {
              await Keyword.updateOne(
                { k_No: levelCost.k_No },
                {
                  $set: {
                    k_Level: downLevel + 1,
                  },
                },
              );
            }
          } else {
            /** 순위를 하락했을 때 중복 순위가 있다면 */
            let sameNo = [];

            do {
              sameLevel = await Keyword.find(
                {
                  p_No: { $ne: p_No },
                  keyword: add[a].keyword,
                  k_Level: downLevel,
                  k_Status: 'on',
                },
                { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
              ).exec();

              if (sameLevel.length != 0) {
                /** 순위 하락시 중복 값 배열에 담기 */
                sameNo.push(sameLevel[0]);
                downLevel++;
              }
            } while (sameLevel != 0);

            for (let b = 0; b < sameNo.length; b++) {
              downLevel = sameNo[b].k_Level + 1;
              let changeStatus = 'on';
              /** 순위를 내려줘야하는 중복 값 중 순위가 5위면 k_Status = "off"로 수정*/
              downLevel == 5 ? (changeStatus = 'off') : (changeStatus = 'on');
              await Keyword.updateOne(
                {
                  k_No: sameNo[b].k_No,
                },
                {
                  $set: {
                    k_Level: downLevel,
                    k_Status: changeStatus,
                  },
                },
              );
            }
          }
          await Keyword.updateOne(
            {
              p_No,
              keyword: add[a].keyword,
            },
            {
              $set: {
                k_Level: add[a].k_Level,
                k_Cost: add[a].k_Cost,
                k_Status: 'on',
              },
            },
          );
        }
      }
    }
    res.status(201).json({
      success: true,
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;

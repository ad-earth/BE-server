const express = require('express');
const router = express.Router();
const Keyword = require('../schemas/keywords');
const Admin = require('../schemas/admins');
const auth = require('../middlewares/admin-middleware');

/** 상품 선택 후 조회 */
router.get('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    let { page, maxpost, sort } = req.query;
    p_No = Number(p_No);

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** 전체 게시물 수 */
    let cnt = await Keyword.find({ a_Idx, p_No }).count();
    let keywordList = [];

    if (cnt != 0) {
      /** page 처리 */
      page = Number(page);
      maxpost = Number(maxpost);

      /** 정렬 최신순 또는 클릭수 */
      if (sort == 'recent') {
        sort = 'k_No';
      } else {
        sort = '-k_Click';
      }

      let skipCnt = 0;
      page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

      let keyword = await Keyword.find({ a_Idx, p_No }, { _id: 0, __v: 0 })
        .sort(sort)
        .limit(maxpost)
        .skip(skipCnt);

      let objData = {};

      for (let a in keyword) {
        /** 총 광고비 계산 */
        let clickCost = keyword[a].k_Click * keyword[a].k_Cost;
        objData = {
          k_No: keyword[a].k_No,
          keyword: keyword[a].keyword,
          k_Level: keyword[a].k_Level,
          k_Cost: keyword[a].k_Cost,
          k_Click: keyword[a].k_Click,
          clickCost: clickCost,
          k_Status: keyword[a].k_Status,
        };
        keywordList.push(objData);
      }
    }

    return res.status(200).send({
      cnt,
      keywordList,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 광고 등록 단일 */
router.post('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    let { keyword, k_Level, k_Cost } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const a_Charge = admin.a_Charge;

    p_No = Number(p_No);
    k_Level = Number(k_Level);
    k_Cost = Number(k_Cost);

    let db = await Keyword.find({ p_No }).exec();

    let objData = {};
    if (db.length >= 20) {
      /** 등록된 키워드가 20개이면 등록 불가 */
      return res.status(400).send({
        errorMessage: '키워드 등록 수 초과로 등록 불가',
      });
    } else if (k_Cost >= a_Charge) {
      /** 입찰금이 보유 충전금보다 적으면 등록 불가 */
      return res.status(400).send({
        errorMessage: '충전금이 부족합니다.',
      });
    } else if (
      (db.length == 0 && k_Level == 5) ||
      (db.length != 0 && k_Level == 5)
    ) {
      /** 5 순위이면 광고 off 상태로 키워드 등록 */
      objData = { p_No, keyword, k_Level, k_Cost, k_Status: 'off' };
    } else {
      /** 기존에 등록된 키워드가 있는지 */
      let keywordData = await Keyword.find({ p_No, keyword }).exec();
      if (keywordData.length != 0) {
        return res.status(400).send({
          errorMessage: '이미 등록된 키워드입니다.',
        });
      }
    }

    /** 현재 키워드로 등록된 키워드가 없다면 입찰금 순위 확인 */
    let levelCost = await Keyword.findOne(
      {
        p_No: { $ne: p_No },
        keyword,
        k_Level,
        k_Status: 'on',
      },
      { _id: 0, p_No: 1, k_Level: 1, k_Cost: 1, k_Status: 1, k_No: 1 },
    ).exec();

    if (levelCost != null && levelCost.k_Cost >= k_Cost) {
      /** 입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환 */
      return res.status(400).send({
        errorMessage: `키워드 ${keyword}의 입찰금 ${k_Cost}원은 순위에 맞는 입찰금이 아닙니다.`,
      });
    } else {
      /** 원하는 순위가 현재 비어있는 순위인지 확인 */
      if (levelCost == null) {
        /** 빈 순위이면 광고 등록 */
        objData = { p_No, keyword, k_Level, k_Cost, k_Status: 'on' };
      } else {
        /** 입찰금이 기존 입찰금보다 높으며, 같은 순위이면 기존 순위를 +1 하여 순위 하락 */
        let downLevel = levelCost.k_Level;

        let sameLevel = await Keyword.find(
          {
            p_No: { $ne: p_No },
            keyword,
            k_Level: downLevel + 1,
            k_Status: 'on',
          },
          { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
        ).exec();

        if (sameLevel.length == 0) {
          /** 순위를 하락했을 때 중복 순위가 없다면 */
          if (downLevel == 4) {
            /** 기존 4위 키워드 5위로 하락시키고 광고 미노출 */
            let offStatus = 'off';
            await Keyword.updateOne(
              {
                k_No: levelCost.k_No,
              },
              {
                $set: {
                  k_Level: downLevel + 1,
                  k_Status: offStatus,
                  k_Click: 0,
                  k_Cost: 0,
                },
              },
            );
          } else {
            await Keyword.updateOne(
              { k_No: levelCost.k_No },
              { $set: { k_Level: downLevel + 1, k_Click: 0 } },
            );
          }
        } else {
          /** 순위를 하락했을 때 중복 순위가 있다면 */
          let sameNo = [];

          do {
            sameLevel = await Keyword.find(
              {
                p_No: { $ne: p_No },
                keyword,
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

          for (let a in sameNo) {
            downLevel = sameNo[a].k_Level + 1;
            let changeStatus = 'on';
            /** 순위를 내려줘야하는 중복 값 중 순위가 5위면 k_Status = "off"로 수정 */
            downLevel == 5 ? (changeStatus = 'off') : (changeStatus = 'on');
            await Keyword.updateOne(
              {
                k_No: sameNo[a].k_No,
              },
              {
                $set: {
                  k_Level: downLevel,
                  k_Status: changeStatus,
                  k_Click: 0,
                },
              },
            );
          }
        }
        objData = { p_No, keyword, k_Level, k_Cost, k_Status: 'on' };
      }
    }

    /** 순위가 없다면 키워드 등록 */
    const recentNo = await Keyword.find().sort('-k_No').limit(1);
    let k_No = 1;
    if (recentNo.length !== 0) {
      k_No = recentNo[0]['k_No'] + 1;
    }

    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

    objData.k_No = k_No;
    objData.createdAt = createdAt;
    objData.a_Idx = a_Idx;

    await Keyword.create(objData);

    return res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 키워드 수정 */
router.put('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    let { keywordList } = req.body;

    p_No = Number(p_No);

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let adminCharge = await Admin.findOne(
      { a_Idx },
      { _id: 0, a_Charge: 1 },
    ).exec();

    for (let a = 0; a < keywordList.length; a++) {
      let levelCost = await Keyword.findOne(
        {
          p_No: { $ne: p_No },
          keyword: keywordList[a].keyword,
          k_Level: keywordList[a].k_Level,
          k_Status: 'on',
        },
        { _id: 0, p_No: 1, k_Level: 1, k_Cost: 1, k_Status: 1, k_No: 1 },
      ).exec();

      if (
        adminCharge.a_Charge <= keywordList[a].k_Cost &&
        keywordList[a].k_Status == 'on'
      ) {
        /** 입찰금이 충전금보다 가격이 낮거나 같으면 errorMessage 반환 */
        return res.status(400).send({
          errorMessage: '충전금이 부족합니다.',
        });
      } else if (
        levelCost != null &&
        levelCost.k_Cost >= keywordList[a].k_Cost &&
        keywordList[a].k_Status == 'on'
      ) {
        let failKeyword = keywordList[a].keyword;
        let failCost = keywordList[a].k_Cost;
        /**입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환 */
        return res.status(400).send({
          errorMessage: `키워드 ${failKeyword}의 입찰금 ${failCost}원은 순위에 맞는 입찰금이 아닙니다.`,
        });
      } else if (keywordList[a].k_Status == 'off') {
        /** k_Status = "off"면 on > off로 수정*/
        await Keyword.updateOne(
          { p_No, keyword: keywordList[a].keyword },
          { $set: { k_Status: 'off', k_Level: 5, k_Click: 0, k_Cost: 0 } },
        );
      } else {
        /** 원하는 순위가 현재 비어있는 순위인지 확인 */
        if (levelCost == null) {
          /** 빈 순위이면 광고 등록 */
          let emptyLevel = await Keyword.updateOne(
            { p_No, keyword: keywordList[a].keyword },
            {
              $set: {
                k_Level: keywordList[a].k_Level,
                k_Cost: keywordList[a].k_Cost,
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
              keyword: keywordList[a].keyword,
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
                    k_Click: 0,
                    k_Cost: 0,
                  },
                },
              );
            } else {
              await Keyword.updateOne(
                { k_No: levelCost.k_No },
                {
                  $set: {
                    k_Level: downLevel + 1,
                    k_Click: 0,
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
                  keyword: keywordList[a].keyword,
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
                    k_Click: 0,
                  },
                },
              );
            }
          }
          await Keyword.updateOne(
            {
              p_No,
              keyword: keywordList[a].keyword,
            },
            {
              $set: {
                k_Level: keywordList[a].k_Level,
                k_Cost: keywordList[a].k_Cost,
                k_Click: 0,
                k_Status: 'on',
              },
            },
          );
        }
      }
    }

    return res.status(200).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 키워드 선택 삭제(복수 가능) */
router.delete('/:p_No', auth, async (req, res) => {
  try {
    const { keywordList } = req.body;
    let { p_No } = req.params;

    p_No = Number(p_No);

    if (keywordList.length != 0) {
      for (let i in keywordList) {
        await Keyword.deleteOne({ k_No: keywordList[i], p_No });
      }
    } else {
      return res.status(404).send({
        errorMessage: '삭제할 키워드를 선택해주세요',
      });
    }
    return res.status(200).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

module.exports = router;

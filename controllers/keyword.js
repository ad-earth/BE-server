const Keyword = require('../schemas/keywords');
const Product = require('../schemas/products');
const Admin = require('../schemas/admins');

const keyword = {
  createKeyword: async (req, res) => {
    try {
      let { p_No } = req.params;
      let { keyword, k_Level, k_Cost, k_Status } = req.body;

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;
      const a_Charge = admin.a_Charge;

      p_No = Number(p_No);
      k_Level = Number(k_Level);
      k_Cost = Number(k_Cost);

      let db = await Keyword.find({ p_No }).exec();

      // 기존에 등록한 키워드 있는지 확인
      let keywordData = await Keyword.find({ p_No, keyword }).exec();

      // 해당 상품의 p_Status 가져오기
      let prodStatus = await Product.findOne(
        { p_No },
        { _id: 0, p_Status: 1 },
      ).exec();

      // 현재 키워드로 등록된 키워드가 없다면 입찰금 순위 확인
      let levelCost = await Keyword.findOne(
        {
          p_No: { $ne: p_No },
          keyword,
          k_Level,
          k_Status: true,
        },
        { _id: 0, p_No: 1, k_Level: 1, k_Cost: 1, k_Status: 1, k_No: 1 },
      ).exec();

      let objData = {};
      if (db.length >= 20) {
        // 등록된 키워드가 20개이면 등록 불가
        return res.status(400).send({
          errorMessage: '키워드 등록 수 초과로 등록 불가',
        });
      } else if (k_Cost >= a_Charge && k_Status == true) {
        // 입찰금이 보유 충전금보다 적으면 등록 불가
        return res.status(400).send({
          errorMessage: '충전금이 부족합니다.',
        });
      } else if (keywordData.length != 0) {
        // 기존에 등록된 키워드가 있다면
        return res.status(400).send({
          errorMessage: '이미 등록된 키워드입니다.',
        });
      } else if (prodStatus.p_Status == false) {
        objData = {
          p_No,
          keyword,
          k_Level: 5,
          k_Cost: 0,
          k_Status: false,
        };
      } else if (
        k_Status == false ||
        (db.length == 0 && k_Level == 5) ||
        (db.length != 0 && k_Level == 5)
      ) {
        // 5 순위이면 광고 off 상태로 키워드 등록
        objData = {
          p_No,
          keyword,
          k_Level: 5,
          k_Cost: 0,
          k_Status: false,
        };
      } else if (levelCost != null && levelCost.k_Cost >= k_Cost) {
        // 현재 키워드로 등록된 키워드가 없다면 입찰금 순위 확인 후
        // 입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환
        return res.status(400).send({
          errorMessage: `키워드 ${keyword}의 입찰금 ${k_Cost}원은 순위에 맞는 입찰금이 아닙니다.`,
        });
      } else {
        // 원하는 순위가 현재 비어있는 순위인지 확인
        if (levelCost == null) {
          // 빈 순위이면 광고 등록
          objData = { p_No, keyword, k_Level, k_Cost, k_Status: true };
        } else {
          // 입찰금이 기존 입찰금보다 높으며, 같은 순위이면 기존 순위를 +1 하여 순위 하락
          let downLevel = levelCost.k_Level;

          let sameLevel = await Keyword.find(
            {
              p_No: { $ne: p_No },
              keyword,
              k_Level: downLevel + 1,
              k_Status: true,
            },
            { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
          ).exec();

          if (sameLevel.length == 0) {
            // 순위를 하락했을 때 중복 순위가 없다면
            if (downLevel == 4) {
              // 기존 4위 키워드 5위로 하락시키고 광고 미노출
              let offStatus = false;
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
            // 순위를 하락했을 때 중복 순위가 있다면
            let sameNo = [];

            do {
              sameLevel = await Keyword.find(
                {
                  p_No: { $ne: p_No },
                  keyword,
                  k_Level: downLevel,
                  k_Status: true,
                },
                { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
              ).exec();

              if (sameLevel.length != 0) {
                // 순위 하락시 중복 값 배열에 담기
                sameNo.push(sameLevel[0]);
                downLevel++;
              }
            } while (sameLevel != 0);

            for (let a in sameNo) {
              downLevel = sameNo[a].k_Level + 1;
              let changeStatus = 'on';
              // 순위를 내려줘야하는 중복 값 중 순위가 5위면 k_Status = "off"로 수정
              downLevel == 5 ? (changeStatus = false) : (changeStatus = true);
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
          objData = { p_No, keyword, k_Level, k_Cost, k_Status: true };
        }
      }

      // 순위가 없다면 키워드 등록
      const recentNo = await Keyword.find().sort('-k_No').limit(1);
      let k_No = 1;
      if (recentNo.length !== 0) {
        k_No = recentNo[0]['k_No'] + 1;
      }

      // 현재 시간 생성
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      objData.k_No = k_No;
      objData.createdAt = createdAt;
      objData.a_Idx = a_Idx;
      objData.p_Status = prodStatus.p_Status;

      await Keyword.create(objData);

      return res.status(201).send({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getKeywords: async (req, res) => {
    try {
      let { p_No } = req.params;

      p_No = Number(p_No);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // 전체 게시물 수
      let cnt = await Keyword.find({ a_Idx, p_No }).count();

      let keywordList = [];

      if (cnt != 0) {
        let keyword = await Keyword.find(
          { a_Idx, p_No },
          { _id: 0, __v: 0 },
        ).exec();

        let objData = {};

        for (let a in keyword) {
          // 총 광고비 계산
          let clickCost = keyword[a].k_Click * keyword[a].k_Cost;
          objData = {
            id: 1 + Number(a),
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
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateKeyword: async (req, res) => {
    try {
      let { p_No } = req.params;
      let { keyword, k_Level, k_Cost, k_Status } = req.body;

      p_No = Number(p_No);
      k_Level = Number(k_Level);
      k_Cost = Number(k_Cost);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let adminCharge = await Admin.findOne(
        { a_Idx },
        { _id: 0, a_Charge: 1 },
      ).exec();

      let statusProd = await Product.findOne(
        { p_No },
        { _id: 0, p_Status: 1 },
      ).exec();

      let levelCost = await Keyword.findOne(
        {
          p_No: { $ne: p_No },
          keyword,
          k_Level,
          k_Status: true,
        },
        { _id: 0, p_No: 1, k_Level: 1, k_Cost: 1, k_Status: 1, k_No: 1 },
      ).exec();

      if (adminCharge.a_Charge <= k_Cost && k_Status == true) {
        // 입찰금이 충전금보다 가격이 낮거나 같으면 errorMessage 반환
        return res.status(400).send({
          errorMessage: '충전금이 부족합니다.',
        });
      } else if (
        levelCost != null &&
        levelCost.k_Cost >= k_Cost &&
        k_Status == true
      ) {
        // 입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환
        return res.status(400).send({
          errorMessage: `키워드 ${keyword}의 입찰금 ${k_Cost}원은 순위에 맞는 입찰금이 아닙니다.`,
        });
      } else if (
        statusProd.p_Status == false ||
        k_Status == false ||
        k_Level == 5
      ) {
        // k_Status = false 또는 k_Level = 5면 true > false로 수정
        await Keyword.updateOne(
          { p_No, keyword },
          {
            $set: {
              k_Status: false,
              k_Level: 5,
              k_Click: 0,
              k_Cost: 0,
            },
          },
        );
      } else {
        // 원하는 순위가 현재 비어있는 순위인지 확인
        if (levelCost == null) {
          // 빈 순위이면 광고 등록
          let emptyLevel = await Keyword.updateOne(
            { p_No, keyword },
            {
              $set: {
                k_Level: k_Level,
                k_Cost: k_Cost,
                k_Status: true,
              },
            },
          );
        } else {
          // 입찰금이 기존 입찰금보다 높으며, 같은 순위이면 기존 순위를 +1 하여 순위 하락
          let downLevel = levelCost.k_Level;

          let sameLevel = await Keyword.find(
            {
              p_No: { $ne: p_No },
              keyword: keyword,
              k_Level: downLevel + 1,
              k_Status: true,
            },
            { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
          ).exec();

          if (sameLevel.length == 0) {
            // 순위를 하락했을 때 중복 순위가 없다면
            if (downLevel == 4) {
              let offStatus = false;
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
            // 순위를 하락했을 때 중복 순위가 있다면
            let sameNo = [];

            do {
              sameLevel = await Keyword.find(
                {
                  p_No: { $ne: p_No },
                  keyword,
                  k_Level: downLevel,
                  k_Status: true,
                },
                { _id: 0, k_No: 1, k_Level: 1, k_Status: 1 },
              ).exec();

              if (sameLevel.length != 0) {
                // 순위 하락시 중복 값 배열에 담기
                sameNo.push(sameLevel[0]);
                downLevel++;
              }
            } while (sameLevel != 0);

            for (let b = 0; b < sameNo.length; b++) {
              downLevel = sameNo[b].k_Level + 1;
              let changeStatus = true;
              // 순위를 내려줘야하는 중복 값 중 순위가 5위면 k_Status = "off"로 수정
              downLevel == 5 ? (changeStatus = false) : (changeStatus = true);
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
              keyword,
            },
            {
              $set: {
                k_Level: k_Level,
                k_Cost: k_Cost,
                k_Click: 0,
                k_Status: true,
              },
            },
          );
        }
      }

      return res.status(200).send({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  deleteKeywords: async (req, res) => {
    try {
      const { keywordList } = req.body;
      let { p_No } = req.params;

      p_No = Number(p_No);

      for (let i in keywordList) {
        await Keyword.deleteOne({ k_No: keywordList[i], p_No });
      }

      return res.status(200).send({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getKeywordCost: async (req, res) => {
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

      let levelCost = 0;

      if (!findKeyword.length) {
        // 광고중인 키워드가 없다면 90원
        levelCost = 90;
      } else {
        // 광고중인 키워드가 있다면
        for (let a in findKeyword) {
          if (k_Level == findKeyword[a].k_Level) {
            // 예상 순위와 같은 키워드가 있으면 +10 반환
            levelCost = findKeyword[a].k_Cost + 10;
            break;
          } else if (k_Level <= 3 && k_Level + 1 == findKeyword[a].k_Level) {
            // 한 순위 낮은 광고 있나 확인 후 그 순위 입찰가 +10 반환
            // 4위를 1순위 낮추면 5위인데 없는 순위라 1~3위만 해당
            levelCost = findKeyword[a].k_Cost + 10;
            break;
          } else if (k_Level <= 2 && k_Level + 2 == findKeyword[a].k_Level) {
            // 3,4위를 2순위 낮추면 5,6위인데 없는 순위라 1,2위만 해당
            levelCost = findKeyword[a].k_Cost + 10;
            break;
          } else if (k_Level <= 1 && k_Level + 3 == findKeyword[a].k_Level) {
            // 2~4위를 3순위 낮추면 5~7위인데 없는 순위라 1위만 해당
            levelCost = findKeyword[a].k_Cost + 10;
            break;
          } else {
            // 해당 순위보다 낮은 순위로 등록된 광고는 없고 높은 순위의 광고만 존재할때
            levelCost = 90;
          }
        }
      }

      return res.status(200).send({
        levelCost,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = keyword;

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/user-middleware');
const Wish = require('../schemas/wishes');
const Product = require('../schemas/products');

/** 위시리스트 등록 및 삭제 */
router.post('/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** db.wish에 해당 u_Idx의 p_No 있나 찾음 */
    const db = await Wish.findOne({ u_Idx, p_No }).exec();
    const recentLike = await Product.find({ p_No }, { _id: 0 }).exec();

    let cnt = 0;
    if (db == null) {
      /** db에 존재하지 않으면 u_Idx, p_No 생성 후 p_Like+1 */
      await Wish.create({ u_Idx, p_No });
      cnt = recentLike[0]['p_Like'] + 1;
    } else {
      /** db에 존재하면 u_Idx, p_No 삭제 후 p_Like-1 */
      await Wish.deleteOne({ u_Idx, p_No });
      cnt = recentLike[0]['p_Like'] - 1;
    }
    /** 조건문 통과한 p_Like 수정 */
    await Product.updateOne({ p_No }, { $set: { p_Like: cnt } });

    return res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: '잘못된 요청입니다.',
    });
  }
});

/** 마이페이지 위시리스트 조회 */
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
    let cnt = await Wish.find({ u_Idx }).count();

    let wishList = [];

    if (cnt == 0) {
      wishList = [];
    } else {
      let db = await Wish.find({ u_Idx }).limit(maxpost).skip(skipCnt);

      for (let x in db) {
        let result = await Product.findOne(
          { p_No: db[x].p_No, p_Status: true },
          {
            _id: 0,
            a_Idx: 0,
            p_Status: 0,
            p_Price: 0,
            p_Option: 0,
            p_Dest: 0,
            createdAt: 0,
            __v: 0,
          },
        ).exec();
        wishList.push(result);
      }

      /** best 기준 like가 1개라도 있으면 true 추후 수정 예정 */
      for (let y in wishList) {
        if (wishList[y].p_Like > 0) {
          wishList[y].p_Best = true;
          wishList[y].p_New = false;
        } else {
          wishList[y].p_Best = false;
          wishList[y].p_New = true;
        }
        wishList[y].p_Thumbnail = wishList[y].p_Thumbnail.slice(0, 1);
      }
    }

    return res.status(200).send({
      cnt,
      wishList,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: '잘못된 요청입니다.',
    });
  }
});

module.exports = router;

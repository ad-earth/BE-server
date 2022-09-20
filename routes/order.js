const express = require('express');
const router = express.Router();
const Order = require('../schemas/orders');
const auth = require('../middlewares/user-middleware');

/** 주문조회 */
router.get('/', auth, async (req, res) => {
  try {
    const { page, maxpost } = req.query;
    /** maxpost 수만큼 page 처리 */
    Number(page, maxpost);
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** 전체 주문 수 */
    let cnt = await Order.find({ u_Idx }).count();

    let orders = await Order.find(
      { u_Idx },
      {
        _id: 0,
        address: 0,
        u_Idx: 0,
        __v: 0,
        o_BankBook: 0,
        o_Receipt: 0,
        o_ReceiptNo: 0,
      },
    )
      .limit(maxpost)
      .skip(skipCnt);

    let orderList = [];
    let list = {};
    let date = 0;

    for (let x in orders) {
      for (let y in orders[x].products) {
        delete orders[x].products[y].k_No;
      }
      date = orders[x].createdAt.substring(0, 10); // yyyy-mm-dd
      orders[x].createdAt = date;
      list = {
        o_No: orders[x].o_No,
        o_Date: orders[x].createdAt,
        o_Price: orders[x].o_Price,
        products: orders[x].products,
      };
      orderList.push(list);
    }

    res.status(200).json({
      cnt,
      orderList,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 주문조회 상세정보 */
router.get('/:o_No', auth, async (req, res) => {
  try {
    const { o_No } = req.params;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    let db = await Order.findOne(
      { o_No, u_Idx },
      { _id: 0, o_BankBook: 0, o_Receipt: 0, o_ReceiptNo: 0, __v: 0 },
    ).exec();

    delete db.address.d_No;

    for (let x in db.products) {
      delete db.products[x].k_No;
    }

    let date = db.createdAt.substring(0, 10);

    let result = {
      o_No: db.o_No,
      o_Date: date,
      o_Price: db.o_Price,
      products: db.products,
      userInfo: {
        u_Name: user.u_Name,
        u_Phone: user.u_Phone,
      },
      address: db.address,
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 주문취소 */
router.put('/:o_No/cancel/:p_No', auth, async (req, res) => {
  try {
    let { o_No, p_No } = req.params;
    p_No = parseInt(p_No);
    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** o_No의 p_No의 o_Status 찾기 */
    let db = await Order.findOne({ o_No }).exec();
    let cancelPrice = 0;
    /** 주문완료일시 취소완료 변경 */
    /** 취소 요청처리해야함 */
    /** 배송완료면 취소완료 변경 안됨 */
    for (let x in db.products) {
      if (
        db.products[x].o_Status === '주문완료' &&
        db.products[x].p_No === p_No
      ) {
        cancelPrice = db.products[x].p_Price;
        db.products[x].o_Status = '취소완료';
      }
    }

    let price = db.o_Price - cancelPrice;

    await Order.updateOne(
      { o_No },
      {
        $set: {
          o_Price: price,
          products: db.products,
        },
      },
    );
    res.status(201).json({
      success: true,
    });
    return;
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;

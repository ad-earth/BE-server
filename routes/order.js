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
module.exports = router;

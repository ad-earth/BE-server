const express = require('express');
const router = express.Router();
const auth = require('../middlewares/admin-middleware');
const Product = require('../schemas/products');
const AdminOrder = require('../schemas/adminOrders');
const SalesProduct = require('../schemas/salesProducts');
const SalesKeyword = require('../schemas/salesKeywords');
const e = require('express');

/** 신규주문 수 */
router.get('/new-orders', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let newOrders = await AdminOrder.find({
      a_Idx,
      o_Status: '신규주문',
    }).count();

    return res.status(200).json({
      newOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
});

/** 노출 상품 수 */
router.get('/on-products', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let productsCnt = await Product.find({ a_Idx, p_Status: true }).count();

    return res.status(200).json({
      productsCnt,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
    });
  }
});

/** 전월 매출액 */
router.get('/last-sales', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** 현재 날짜 */
    let today = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 10);

    let startDate = new Date(today);
    let start = new Date(today);
    let endDate = new Date(today);
    let end = new Date(today);

    /** 지난 달 1일 */
    start.setMonth(startDate.getMonth() - 1);
    start.setDate(startDate.getDate() - startDate.getDate() + 1);

    /** 현재 달 1일 */
    end.setDate(endDate.getDate() - endDate.getDate() + 1);

    let data = await SalesProduct.aggregate([
      { $match: { a_Idx, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: a_Idx, p_Price: { $sum: '$p_Price' } } },
    ]);

    let lastSales = data[0].p_Price;

    res.status(200).json({
      lastSales,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
});

/** 광고 키워드 순위 10 */
/** 광고 요약 보고서 */
router.get('/expense-reports', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** 현재 날짜 */
    let today = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 10);

    let startDate = new Date(today);
    let start = new Date(today);
    let endDate = new Date(today);
    let end = new Date(today);

    let objData = {};
    let data = [];
    for (let i = 1; i < 4; i++) {
      /** 지난 달 1일 */
      start.setMonth(startDate.getMonth() - i);
      start.setDate(startDate.getDate() - startDate.getDate() + 1);

      /** 현재 달 1일 */
      end.setMonth(endDate.getMonth() - i + 1);
      end.setDate(endDate.getDate() - endDate.getDate() + 1);

      let result = await SalesKeyword.aggregate([
        { $match: { a_Idx, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: a_Idx,
            k_Cost: { $sum: '$k_Cost' },
            p_Price: { $sum: '$p_Price' },
          },
        },
      ]);

      if (result.length == 1) {
        objData = {
          month: start.getMonth() + 1 + '월',
          adCost: result[0].k_Cost,
          salesCost: result[0].p_Price,
        };
      } else {
        objData = {
          month: start.getMonth() + 1 + '월',
          adCost: 0,
          salesCost: 0,
        };
      }

      data.push(objData);
    }
    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;

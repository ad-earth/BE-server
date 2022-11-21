const Product = require('../schemas/products');
const AdminOrder = require('../schemas/adminOrders');
const Admin = require('../schemas/admins');
const SalesProduct = require('../schemas/salesProducts');
const SalesKeyword = require('../schemas/salesKeywords');

const adminMain = {
  getNewOrders: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let newOrders = await AdminOrder.find({
        a_Idx,
        o_Status: '신규주문',
      }).count();

      return res.status(200).send({
        newOrders,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getOnProducts: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let productsCnt = await Product.find({ a_Idx, p_Status: true }).count();

      return res.status(200).send({
        productsCnt,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getLastSales: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // 현재 날짜
      let today = new Date(+new Date() + 3240 * 10000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 10);

      let startDate = new Date(today);
      let start = new Date(today);
      let endDate = new Date(today);
      let end = new Date(today);

      // 지난 달 1일
      start.setMonth(startDate.getMonth() - 1);
      start.setDate(startDate.getDate() - startDate.getDate() + 1);

      // 현재 달 1일
      end.setDate(endDate.getDate() - endDate.getDate() + 1);

      let data = await SalesProduct.aggregate([
        { $match: { a_Idx, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: a_Idx, p_Price: { $sum: '$p_Price' } } },
      ]);

      let lastSales = 0;
      if (data.length == 0) {
        lastSales = 0;
      } else {
        lastSales = data[0].p_Price;
      }

      res.status(200).send({
        lastSales,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getPopularKeywords: async (req, res) => {
    try {
      let data = await SalesKeyword.aggregate([
        {
          $group: {
            _id: { keyword: '$keyword' },
            k_Click: { $sum: '$k_Click' },
          },
        },
        { $limit: 10 },
        { $sort: { k_Click: -1 } },
      ]);

      let keywords = [];

      if (data.length == 0) {
        keywords = ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
      } else {
        for (let x in data) {
          keywords.push(data[x]._id.keyword);
        }
        if (keywords.length != 10) {
          // 키워드가 10개 미만이면 남은 키워드 자리 '-'으로 반환
          let pushCnt = 10 - keywords.length;
          for (let y = 0; y < pushCnt; y++) {
            keywords.push('-');
          }
        }
      }

      return res.status(200).send({
        keywords,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getExpenseReports: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // 현재 날짜
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
        // 지난 달 1일
        start.setMonth(startDate.getMonth() - i);
        start.setDate(startDate.getDate() - startDate.getDate() + 1);

        // 현재 달 1일
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
      data.reverse();

      return res.status(200).send({
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getCharge: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      const db = await Admin.findOne({ a_Idx }, { _id: 0, a_Charge: 1 }).exec();

      return res.status(200).send(db);
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateCharge: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      const db = await Admin.findOne({ a_Idx }, { _id: 0, a_Charge: 1 }).exec();

      let charge = db.a_Charge + 10000;

      await Admin.updateOne({ a_Idx }, { $set: { a_Charge: charge } });

      return res.status(201).send({
        success: true,
      });
    } catch (error) {
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = adminMain;

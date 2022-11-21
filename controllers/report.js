const SalesKeyword = require('../schemas/salesKeywords');
const SalesProduct = require('../schemas/salesProducts');

const report = {
  getKeywordReport: async (req, res) => {
    try {
      let { date, p_No } = req.query;
      p_No = Number(p_No);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // date 처리
      let start = new Date(date.substring(1, 11));
      let endDate = new Date(date.substring(12, 22));
      let end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      let data = await SalesKeyword.aggregate([
        {
          $match: {
            a_Idx,
            p_No,
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { p_No: '$p_No', keyword: '$keyword' },
            k_Click: { $sum: '$k_Click' },
            k_Cost: { $sum: '$k_Cost' },
            k_Trans: { $sum: '$k_Trans' },
            p_Price: { $sum: '$p_Price' },
          },
        },
      ]);

      let objData = {};
      let list = [];

      for (let a in data) {
        objData = {
          keyword: data[a]._id.keyword,
          k_Click: data[a].k_Click,
          k_Cost: data[a].k_Cost,
          k_Trans: data[a].k_Trans,
          p_Price: data[a].p_Price,
        };
        list.push(objData);
      }

      // 전체 수
      let cnt = list.length;

      return res.status(200).send({
        cnt,
        list,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getProductReport: async (req, res) => {
    try {
      let { date, p_Category } = req.query;

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // date 처리
      let startDate = Date;
      let start = '';
      let endDate = Date;
      let end = '';
      let objMatch = {};

      if (date == 'null' && p_Category == 'null') {
        // YYYY-MM-DD
        let now = new Date(+new Date() + 3240 * 10000)
          .toISOString()
          .replace('T', ' ')
          .substring(0, 10);

        // 하루 전
        startDate = new Date(now);
        start = new Date(startDate);
        endDate = new Date(now);
        end = new Date(endDate);

        start.setDate(startDate.getDate() - 1);
        end.setDate(endDate.getDate());

        objMatch = { a_Idx, createdAt: { $gte: start, $lte: end } };
      } else if (date == 'null' && p_Category != 'null') {
        // 카테고리 조회
        objMatch = { a_Idx, p_Category };
      } else if (date != 'null' && p_Category == 'null') {
        // 기간 조회
        start = new Date(date.substring(1, 11));
        endDate = new Date(date.substring(12, 22));
        end = new Date(endDate);
        end.setDate(endDate.getDate() + 1);

        objMatch = { a_Idx, createdAt: { $gte: start, $lte: end } };
      } else {
        // 카테고리, 기간 조회
        start = new Date(date.substring(1, 11));
        endDate = new Date(date.substring(12, 22));
        end = new Date(endDate);
        end.setDate(endDate.getDate() + 1);

        objMatch = { a_Idx, p_Category, createdAt: { $gte: start, $lte: end } };
      }

      let data = await SalesProduct.aggregate([
        { $match: objMatch },
        {
          $group: {
            _id: {
              p_No: '$p_No',
              p_Category: '$p_Category',
              p_Name: '$p_Name',
            },
            p_Cnt: { $sum: '$p_Cnt' },
            p_Price: { $sum: '$p_Price' },
          },
        },
      ]);

      // 총 금액
      let totalPrice = 0;

      let objData = {};
      let products = [];
      for (let a in data) {
        objData = {
          p_No: data[a]._id.p_No,
          p_Name: data[a]._id.p_Name,
          p_Cnt: data[a].p_Cnt,
          p_Price: data[a].p_Price,
        };
        totalPrice += objData.p_Price;
        products.push(objData);
      }

      // 전체 수
      let cnt = products.length;

      return res.status(200).send({
        cnt,
        totalPrice,
        products,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = report;

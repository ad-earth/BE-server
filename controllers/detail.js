const Product = require('../schemas/products');
const Wish = require('../schemas/wishes');
const Keyword = require('../schemas/keywords');
const Admin = require('../schemas/admins');
const Billing = require('../schemas/salesKeywords');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const jwtKey = process.env.U_TOKEN;

const detail = {
  getProductDetail: async (req, res) => {
    let { p_No } = req.params;
    let { keyword } = req.query;

    p_No = Number(p_No);

    let k_No = 0;
    if (keyword != 'null') {
      // db.expense 현재 키워드, 키워드번호, 입찰금 생성 및 charge 금액 차감
      // keyword db의 현재 키워드 클릭수 +1
      let keywordData = await Keyword.findOne({ p_No, keyword }).exec();
      await Keyword.updateOne(
        { p_No, keyword },
        { $set: { k_Click: keywordData.k_Click + 1 } },
      );

      k_No = keywordData.k_No;

      let adminProd = await Product.findOne({ p_No }).exec();
      let adminData = await Admin.findOne({ a_Idx: adminProd.a_Idx });
      await Admin.updateOne(
        { a_Idx: adminData.a_Idx },
        {
          $set: { a_Charge: adminData.a_Charge - keywordData.k_Cost },
        },
      );

      // 현재 시간 생성
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      await Billing.create({
        a_Idx: adminData.a_Idx,
        keyword: keyword,
        p_No: p_No,
        k_Click: 1,
        k_Cost: keywordData.k_Cost,
        createdAt: createdAt,
      });
    }
    try {
      let product = await Product.findOne(
        { p_No, p_Status: true },
        { _id: 0, a_Idx: 0, createdAt: 0, p_Price: 0, __v: 0, p_Status: 0 },
      ).exec();

      // wish 유저
      let userLike = false;

      const { authorization } = req.headers;
      const [tokenType, tokenValue] = (authorization || '').split(' ');

      if (tokenType == 'Bearer' && tokenValue == 'null') {
        userLike = false;
      } else {
        const { u_Idx } = jwt.verify(tokenValue, jwtKey);
        let idx = u_Idx;

        let wishUser = await Wish.find({
          u_Idx: idx,
          p_No: product.p_No,
        });

        if (wishUser.length > 0) {
          userLike = true;
        } else {
          userLike = false;
        }
      }

      // p_Best 여부
      if (product.p_Like > 10) {
        product.p_Best = true;
      } else {
        product.p_Best = false;
      }

      return res.status(200).send({
        userLike: userLike,
        k_No,
        product,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = detail;

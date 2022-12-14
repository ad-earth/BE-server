const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
const Wish = require('../schemas/wishes');

const product = {
  createProduct: async (req, res) => {
    try {
      let {
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

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;
      const a_Brand = admin.a_Brand;

      let p_No = new Date().valueOf();

      // 현재 날짜 생성
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      // 썸네일 빈 배열 요소 삭제
      if (p_Thumbnail[1].length < 1) {
        // 1번째 인덱스 삭제
        p_Thumbnail = p_Thumbnail.slice(0, 1);
      }

      // 옵션 객체 배열로 변환
      let arrOption = [];
      let arrDetail = [];

      for (let i in p_Option) {
        arrDetail = [
          p_Option[i].color,
          p_Option[i].colorCode,
          p_Option[i].option,
          p_Option[i].optionPrice,
          p_Option[i].optionCnt,
        ];
        arrOption.push(arrDetail);
      }

      p_Option = arrOption;

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
  getProducts: async (req, res) => {
    try {
      let { page, maxpost, p_Category } = req.query;

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let findData = {};
      if (p_Category.length != 0 && p_Category != '전체') {
        // 카테고리별 상품
        findData = { a_Idx, p_Category };
      } else {
        // 전체 상품
        findData = { a_Idx };
      }

      // 총 상품 수
      let cnt = await Product.find(findData).count();

      let list = [];

      if (cnt == 0) {
        list = [];
      } else {
        // page처리
        page = Number(page);
        maxpost = Number(maxpost);

        let skipCnt = 0;
        page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

        let data = await Product.find(findData, {
          _id: 0,
          p_No: 1,
          p_Category: 1,
          p_Name: 1,
          p_Status: 1,
        })
          .sort()
          .limit(maxpost)
          .skip(skipCnt);

        let objData = {};
        for (let a in data) {
          objData = {
            id: skipCnt + 1 + Number(a),
            p_No: data[a].p_No,
            p_Category: data[a].p_Category,
            p_Name: data[a].p_Name,
            p_Status: data[a].p_Status,
          };
          list.push(objData);
        }
      }

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
  getProductsList: async (req, res) => {
    try {
      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let productList = await Product.find(
        { a_Idx },
        { _id: 0, p_No: 1, p_Name: 1 },
      ).exec();

      return res.status(200).send({
        productList,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getProductDetail: async (req, res) => {
    try {
      let { p_No } = req.params;

      p_No = Number(p_No);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let prodInfo = await Product.findOne(
        { a_Idx, p_No },
        {
          _id: 0,
          p_Category: 1,
          p_Thumbnail: 1,
          p_Name: 1,
          p_Cost: 1,
          p_Sale: 1,
          p_Discount: 1,
          p_Option: 1,
          p_Desc: 1,
          p_Content: 1,
        },
      ).exec();

      let arrOption = [];
      let objOption = {};
      for (let i in prodInfo.p_Option) {
        objOption = {
          color: prodInfo.p_Option[i][0],
          colorCode: prodInfo.p_Option[i][1],
          option: prodInfo.p_Option[i][2],
          optionPrice: prodInfo.p_Option[i][3],
          optionCnt: prodInfo.p_Option[i][4],
        };

        arrOption.push(objOption);
      }

      prodInfo.p_Option = arrOption;

      return res.status(200).send(prodInfo);
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateProductStatus: async (req, res) => {
    try {
      let { p_No } = req.params;

      p_No = Number(p_No);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let db = await Product.findOne(
        { p_No },
        { _id: 0, a_Idx: 1, p_Status: 1 },
      ).exec();

      let status = true;
      let keywordSet = {};

      if (a_Idx == db.a_Idx) {
        if (db.p_Status == true) {
          status = false;
          // 상품 미노출 상태로 변경이라 키워드 전체 미노출 변경
          keywordSet = {
            k_Status: status,
            k_Level: 5,
            k_Cost: 0,
            p_Status: false,
          };
        } else {
          status = true;
          keywordSet = { p_Status: true };
        }
        let keywordDb = await Keyword.find({ p_No }).count();

        if (keywordDb != 0) {
          await Keyword.updateMany(
            { p_No },
            {
              $set: keywordSet,
            },
          );
        }
        await Product.updateOne(
          { p_No },
          {
            $set: {
              p_Status: status,
            },
          },
        );
        return res.status(201).send({
          success: true,
        });
      } else {
        return res.status(401).send({
          errorMessage: '권한 없음',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateProductInfo: async (req, res) => {
    try {
      let { p_No } = req.params;
      let {
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

      p_No = Number(p_No);

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      // 옵션 객체 배열 변경
      let arrDetail = [];
      let arrOption = [];

      for (let i in p_Option) {
        arrDetail = [
          p_Option[i].color,
          p_Option[i].colorCode,
          p_Option[i].option,
          p_Option[i].optionPrice,
          p_Option[i].optionCnt,
        ];
        arrOption.push(arrDetail);
      }

      p_Option = arrOption;

      let db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();

      // token과 param의 a_Idx 일치하는지 확인
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
        return res.status(201).send({
          success: true,
        });
      } else {
        return res.status(401).send({
          errorMessage: '권한 없음',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  deleteProducts: async (req, res) => {
    try {
      let { p_No } = req.body;

      // token
      const { admin } = res.locals;
      const a_Idx = admin.a_Idx;

      let db = await Product.findOne(
        { p_No: p_No[0] },
        { _id: 0, a_Idx: 1 },
      ).exec();

      if (a_Idx == db.a_Idx) {
        for (let i in p_No) {
          // 등록 상품 삭제
          await Product.deleteOne({ p_No: p_No[i] });
          // 등록 키워드 삭제
          await Keyword.deleteMany({ p_No: p_No[i], a_Idx });
          // 위시리스트 삭제
          await Wish.deleteMany({ p_No: p_No[i] });
        }

        return res.status(200).send({
          success: true,
        });
      } else {
        return res.status(401).send({
          errorMessage: '권한 없음',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = product;

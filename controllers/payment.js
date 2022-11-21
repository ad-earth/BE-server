const User = require('../schemas/users');
const Delivery = require('../schemas/deliveries');
const Product = require('../schemas/products');
const Order = require('../schemas/orders');
const AdminOrder = require('../schemas/adminOrders');

const payment = {
  getPaymentInfo: async (req, res) => {
    try {
      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // userInfo
      const userInfo = await User.findOne(
        { u_Idx },
        {
          _id: 0,
          u_Name: 1,
          u_Phone: 1,
          u_Address1: 1,
          u_Address2: 1,
          u_Address3: 1,
        },
      ).exec();

      // addressList
      const addressList = await Delivery.find(
        { u_Idx },
        { _id: 0, __v: 0 },
      ).exec();

      return res.status(200).send({
        userInfo,
        addressList,
      });
    } catch (error) {
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  createPayment: async (req, res) => {
    try {
      let { address, products, o_Price } = req.body;

      let arrProductOptionInfo = [];
      for (let b in products) {
        if (products[b].option[0] == null) {
          // 빈배열이면 가공
          arrProductOptionInfo = [null, null, 0];
          arrProductOptionInfo.push(products[b].totalQty);
          arrProductOptionInfo.push(products[b].totalPrice);
          products[b].option.push(arrProductOptionInfo);
        } else {
          // 배열 요소 colorCode 삭제
          for (let c in products[b].option) {
            products[b].option[c].splice(1, 1);
          }
        }
      }

      // indexedDb 변수명 처리
      let objProductData = {};
      let arrProductData = [];
      for (let w in products) {
        objProductData = {
          k_No: products[w].keywordNo,
          p_No: products[w].id,
          p_Thumbnail: products[w].thumbnail,
          p_Category: products[w].category,
          a_Brand: products[w].brand,
          p_Name: products[w].name,
          p_Cost: products[w].price,
          p_Discount: products[w].discount,
          p_Option: products[w].option,
          p_Price: products[w].totalPrice,
          p_Cnt: products[w].totalQty,
        };
        arrProductData.push(objProductData);
      }

      products = arrProductData;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // 해당 상품의 p_Status = false이거나 p_Soldout = true 면 결제 불가
      for (let i in products) {
        let status = await Product.findOne(
          { p_No: products[i].p_No },
          { _id: 0, p_Status: 1, p_Soldout: 1, p_No: 1, p_Name: 1 },
        );

        if (status.p_Soldout == true || status.p_Status == false) {
          return res.status(404).send({
            errorMessage: `해당 ${status.p_Name} 상품은 현재 구매 불가능한 상품입니다.`,
          });
        }
      }

      let memo = address.d_Memo;

      if (address.d_No == 0) {
        // 신규 배송지 추가
        const recentDNo = await Delivery.find().sort('-d_No').limit(1);
        let d_No = 1;
        if (recentDNo.length !== 0) {
          d_No = recentDNo[0]['d_No'] + 1;
        }
        await Delivery.create({
          d_No,
          u_Idx,
          d_Name: address.d_Name,
          d_Phone: address.d_Phone,
          d_Address1: address.d_Address1,
          d_Address2: address.d_Address2,
          d_Address3: address.d_Address3,
        });

        let newAddress = await Delivery.findOne(
          { d_No },
          { _id: 0, __v: 0, u_Idx: 0 },
        ).exec();

        address = {
          d_No: newAddress.d_No,
          d_Name: newAddress.d_Name,
          d_Phone: newAddress.d_Phone,
          d_Address1: newAddress.d_Address1,
          d_Address2: newAddress.d_Address2,
          d_Address3: newAddress.d_Address3,
          d_Memo: memo,
        };
      } else if (address.d_No == null) {
        // userInfo로 보냄
        let recentUserNo = await Delivery.find().sort('-d_No').limit(1);
        let d_No = 1;
        if (recentUserNo.length !== 0) {
          d_No = recentUserNo[0]['d_No'] + 1;
        }
        await Delivery.create({
          d_No,
          u_Idx,
          d_Name: user.u_Name,
          d_Phone: user.u_Phone,
          d_Address1: user.u_Address1,
          d_Address2: user.u_Address2,
          d_Address3: user.u_Address3,
        });

        let userNewAddress = await Delivery.findOne(
          { d_No },
          { _id: 0, __v: 0, u_Idx: 0 },
        ).exec();

        address = {
          d_No: userNewAddress.d_No,
          d_Name: userNewAddress.d_Name,
          d_Phone: userNewAddress.d_Phone,
          d_Address1: userNewAddress.d_Address1,
          d_Address2: userNewAddress.d_Address2,
          d_Address3: userNewAddress.d_Address3,
          d_Memo: memo,
        };
      } else {
        // d_No 기존에 존재함
        let trueNo = await Delivery.findOne({ d_No: address.d_No }).exec();
        address = {
          d_No: trueNo.d_No,
          d_Name: trueNo.d_Name,
          d_Phone: trueNo.d_Phone,
          d_Address1: trueNo.d_Address1,
          d_Address2: trueNo.d_Address2,
          d_Address3: trueNo.d_Address3,
          d_Memo: memo,
        };
      }

      // products[i].o_Status = "주문완료"
      for (let x in products) {
        products[x].o_Status = '주문완료';
        products[x].r_Status = false;
      }

      let o_No = new Date().valueOf();

      // 현재 날짜 생성
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      await Order.create({
        o_No,
        u_Idx,
        address,
        products,
        o_Price,
        createdAt,
      });

      // 신규 주문 admin에 보내야함
      for (let j in products) {
        let adminIdx = await Product.findOne(
          { p_No: products[j].p_No },
          { _id: 0, a_Idx: 1 },
        );

        await AdminOrder.create({
          o_No: o_No,
          a_Idx: adminIdx.a_Idx,
          p_No: products[j].p_No,
          u_Idx: u_Idx,
          u_Id: user.u_Id,
          products: products[j],
          address: address,
          o_Date: createdAt,
          o_Status: '신규주문',
        });
      }

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
  getCompletePayment: async (req, res) => {
    try {
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // 제일 최근에 주문한 주문 번호
      let orders = await Order.findOne(
        { u_Idx },
        { _id: 0, o_No: 1, o_Price: 1, address: 1 },
      )
        .sort('-o_No')
        .exec();

      let result = {
        o_No: orders.o_No,
        o_Price: orders.o_Price,
        d_Name: orders.address.d_Name,
        d_Phone: orders.address.d_Phone,
        d_Address1: orders.address.d_Address1,
        d_Address2: orders.address.d_Address2,
        d_Address3: orders.address.d_Address3,
      };

      return res.status(200).send(result);
    } catch (error) {
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = payment;

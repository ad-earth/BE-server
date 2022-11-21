const Delivery = require('../schemas/deliveries');

const shipping = {
  updateOrderAddress: async (req, res) => {
    try {
      const { d_No } = req.params;
      const { d_Name, d_Phone, d_Address1, d_Address2, d_Address3 } = req.body;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // db.Deliveries에 해당 유저의 배송지 고유번호 있나 확인
      let db = await Delivery.find({ u_Idx, d_No });
      if (db.length > 0) {
        await Delivery.updateOne(
          { u_Idx, d_No },
          {
            $set: {
              d_Name,
              d_Phone,
              d_Address1,
              d_Address2,
              d_Address3,
            },
          },
        );
      } else {
        return res.status(404).send({
          errorMessage: '잘못된 요청입니다.',
        });
      }
      return res.status(201).send({
        success: true,
      });
    } catch (error) {
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  deleteOrderAddress: async (req, res) => {
    try {
      const { d_No } = req.params;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // db.Deliveries에 해당 유저의 배송지 고유번호 있나 확인
      let db = await Delivery.find({ u_Idx, d_No });

      if (db.length > 0) {
        await Delivery.deleteOne({ u_Idx, d_No });
      } else {
        return res.status(404).send({
          errorMessage: '잘못된 요청입니다.',
        });
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
};

module.exports = shipping;

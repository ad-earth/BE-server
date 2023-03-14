const User = require('../schemas/users');
const Cart = require('../schemas/carts');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.U_TOKEN;

const reg = {
  id: new RegExp('^[a-zA-Z0-9]{5,10}$'),
  pw: new RegExp(
    '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
  ),
  phone: /^\d{3}-\d{3,4}-\d{4}$/,
};

const schemas = {
  registerSchema: Joi.object({
    u_Id: Joi.string().pattern(reg.id).required(),
    u_Pw: Joi.string().pattern(reg.pw).required(),
    u_Phone: Joi.string().pattern(reg.phone).required(),
    u_Name: Joi.string().required(),
    u_Gender: Joi.string().required(),
    u_Address1: Joi.string().required(),
    u_Address2: Joi.string().required(),
    u_Address3: Joi.string().required(),
    u_Img: Joi.string(),
  }),
  findIdSchema: Joi.object({
    u_Name: Joi.string().required(),
    u_Phone: Joi.string().pattern(reg.phone).required(),
  }),
  findPwSchema: Joi.object({
    u_Id: Joi.string().pattern(reg.id).required(),
    u_Phone: Joi.string().pattern(reg.phone).required(),
    u_Name: Joi.string().required(),
  }),
  pwSchema: Joi.object({
    u_Pw: Joi.string().pattern(reg.pw).required(),
    u_Idx: Joi.number().required(),
  }),
  loginSchema: Joi.object({
    u_Id: Joi.string().pattern(reg.id).required(),
    u_Pw: Joi.string().pattern(reg.pw).required(),
  }),
};

const client = {
  createClient: async (req, res) => {
    try {
      let {
        u_Id,
        u_Pw,
        u_Phone,
        u_Name,
        u_Gender,
        u_Address1,
        u_Address2,
        u_Address3,
        u_Img,
      } = await schemas.registerSchema.validateAsync(req.body);

      // 유저 번호 확인 및 생성
      const recentUser = await User.find().sort('-u_Idx').limit(1);
      let u_Idx = 1;
      if (recentUser.length != 0) {
        u_Idx = recentUser[0]['u_Idx'] + 1;
      }
      // 아이디 중복 확인
      const userId = await User.find({ u_Id: u_Id }).exec();
      if (userId.length !== 0) {
        return res.status(400).send({
          errorMessage: '중복된 아이디입니다.',
        });
      }
      // 연락처 중복 확인
      const userPhone = await User.find({ u_Phone: u_Phone }).exec();
      if (userPhone.length !== 0) {
        return res.status(400).send({
          errorMessage: '중복된 연락처입니다.',
        });
      }

      // 비밀번호 hash 처리
      const salt = await bcrypt.genSalt();
      const hashPw = await bcrypt.hash(u_Pw, salt);

      // 현재 날짜 생성
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

      // 구매자 정보 생성
      await User.create({
        u_Idx,
        u_Id,
        u_Pw: hashPw,
        u_Name,
        u_Address1,
        u_Address2,
        u_Address3,
        u_Gender,
        u_Phone,
        u_Img,
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
  getClientId: async (req, res) => {
    try {
      const { u_Name, u_Phone } = await schemas.findIdSchema.validateAsync(
        req.query,
      );
      const userName = await User.find({ u_Name: u_Name }).exec();
      const userPhone = await User.find({ u_Phone: u_Phone }).exec();

      if (userName.length === 0 || userPhone.length === 0) {
        return res.status(400).send({
          errorMessage: '존재하지 않는 회원입니다.',
        });
      }

      let data = await User.findOne(
        { u_Name, u_Phone },
        { _id: 0, u_Id: 1 },
      ).exec();

      return res.status(200).send(data);
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  getClientPw: async (req, res) => {
    try {
      const { u_Id, u_Name, u_Phone } =
        await schemas.findPwSchema.validateAsync(req.query);
      const userId = await User.find({ u_Id: u_Id }).exec();
      const userName = await User.find({ u_Name: u_Name }).exec();
      const userPhone = await User.find({ u_Phone: u_Phone }).exec();
      if (userId.length == 0 || userName.length == 0 || userPhone.length == 0) {
        return res.status(400).send({
          errorMessage: '존재하지 않는 회원입니다.',
        });
      }
      let data = await User.findOne(
        { u_Name, u_Phone, u_Id },
        { _id: 0, u_Idx: 1 },
      ).exec();
      if (data == null) {
        return res.status(400).send({
          errorMessage: '존재하지 않는 회원입니다.',
        });
      }
      return res.status(200).send(data);
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateClientPw: async (req, res) => {
    try {
      const { u_Idx, u_Pw } = await schemas.pwSchema.validateAsync(req.body);
      // 존재하는 유저인가 확인
      const userNo = await User.find({ u_Idx }).exec();
      if (userNo.length === 0) {
        return res.status(400).send({
          errorMessage: '존재하지 않는 회원입니다.',
        });
      }

      // 비밀번호 hash 처리
      const salt = await bcrypt.genSalt();
      const hashPw = await bcrypt.hash(u_Pw, salt);

      await User.updateOne({ u_Idx }, { $set: { u_Pw: hashPw } });
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
  createClientToken: async (req, res) => {
    try {
      const { u_Id, u_Pw } = await schemas.loginSchema.validateAsync(req.body);
      const user = await User.findOne({ u_Id }).exec();
      if (!user) {
        return res.status(400).send({
          errorMessage: '아이디 또는 비밀번호를 확인해주세요',
        });
      }

      let u_Idx = user.u_Idx;
      let u_Name = user.u_Name;
      let u_Address1 = user.u_Address1;
      let u_Address2 = user.u_Address2;
      let u_Address3 = user.u_Address3;
      let u_Gender = user.u_Gender;
      let u_Phone = user.u_Phone;
      let u_Img = user.u_Img;

      // 비밀번호 매치 검사
      const authenticate = await bcrypt.compare(u_Pw, user.u_Pw);

      if (authenticate === true) {
        const token = jwt.sign({ u_Idx: user.u_Idx }, jwtKey);

        let userInfo = {
          u_Idx,
          u_Id,
          u_Name,
          u_Address1,
          u_Address2,
          u_Address3,
          u_Gender,
          u_Phone,
          u_Img,
          token,
        };

        let cartStatus = await Cart.find({ u_Idx, c_Type: 'c' }).count();

        return res.status(200).send({
          userInfo,
          cartStatus,
        });
      } else {
        return res.status(401).send({
          errorMessage: '아이디 또는 비밀번호를 확인해주세요',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
  updateClientInfo: async (req, res) => {
    try {
      const {
        u_Name,
        u_Address1,
        u_Address2,
        u_Address3,
        u_Gender,
        u_Phone,
        u_Img,
      } = req.body;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      await User.updateOne(
        { u_Idx },
        {
          $set: {
            u_Name,
            u_Address1,
            u_Address2,
            u_Address3,
            u_Gender,
            u_Phone,
            u_Img,
          },
        },
      );
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
  deleteClient: async (req, res) => {
    try {
      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      let cartData = await Cart.find({ u_Idx }).exec();
      if (cartData.length !== 0) {
        await Cart.deleteMany({ u_Idx });
      }
      await User.deleteOne({ u_Idx });

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

module.exports = client;

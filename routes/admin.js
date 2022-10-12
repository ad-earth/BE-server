const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../schemas/admins');
const AdminOrder = require('../schemas/adminOrders');
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
const Wish = require('../schemas/wishes');
const bcrypt = require('bcryptjs');
const auth = require('../middlewares/admin-middleware');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.A_TOKEN;

const reg = /^\d{3}-\d{3,4}-\d{4}$/;

/** 회원가입 검증 */
const registerSchema = Joi.object({
  a_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  a_Pw: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
      ),
    )
    .required(),
  a_Brand: Joi.string().required(),
  a_Number: Joi.string().required(),
  a_Phone: Joi.string().pattern(reg).required(),
});

/** 회원가입 */
router.post('/register', async (req, res) => {
  try {
    const { a_Id, a_Pw, a_Brand, a_Number, a_Phone } =
      await registerSchema.validateAsync(req.body);

    /** 판매자 번호 확인 및 생성 */
    const recentAdmin = await Admin.find().sort('-a_Idx').limit(1);
    let a_Idx = 1;
    if (recentAdmin.length != 0) {
      a_Idx = recentAdmin[0]['a_Idx'] + 1;
    }

    /** 아이디 중복 확인 */
    const adminId = await Admin.find({ a_Id: a_Id }).exec();
    if (adminId.length !== 0) {
      return res.status(400).send({
        errorMessage: '중복된 아이디입니다.',
      });
    }

    /** 연락처 중복 확인 */
    const adminPhone = await Admin.find({ a_Phone: a_Phone }).exec();
    if (adminPhone.length !== 0) {
      return res.status(400).send({
        errorMessage: '중복된 연락처입니다.',
      });
    }

    /** 사업자번호 중복 확인 */
    const adminNumber = await Admin.find({ a_Number: a_Number }).exec();
    if (adminNumber.length !== 0) {
      return res.status(400).send({
        errorMessage: '중복된 사업자번호입니다.',
      });
    }

    /** 비밀번호 hash 처리 */
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(a_Pw, salt);

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

    /** DB 생성 */
    await Admin.create({
      a_Idx,
      a_Id,
      a_Pw: hashPw,
      a_Brand,
      a_Number,
      a_Phone,
      createdAt,
    });

    return res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 아이디 검증 */
const findIdSchema = Joi.object({
  a_Brand: Joi.string().required(),
  a_Number: Joi.string().required(),
});

/** 아이디 찾기 */
router.get('/find-id', async (req, res) => {
  try {
    const { a_Brand, a_Number } = await findIdSchema.validateAsync(req.query);
    const adminBrand = await Admin.find({ a_Brand: a_Brand }).exec();
    const adminNumber = await Admin.find({ a_Number: a_Number }).exec();

    if (adminBrand.length === 0 || adminNumber.length === 0) {
      return res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
    }
    let data = await Admin.findOne(
      { a_Brand, a_Number },
      { _id: 0, a_Id: 1 },
    ).exec();

    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 비밀번호 찾기 1차 검증 */
const findPwSchema = Joi.object({
  a_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  a_Number: Joi.string().required(),
});

/** 비밀번호 찾기 1차 */
router.get('/find-password', async (req, res) => {
  try {
    const { a_Id, a_Number } = await findPwSchema.validateAsync(req.query);

    const adminId = await Admin.find({ a_Id: a_Id }).exec();
    const adminNumber = await Admin.find({ a_Number: a_Number }).exec();

    if (adminId.length == 0 || adminNumber.length == 0) {
      return res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
    }

    let data = await Admin.findOne(
      { a_Id, a_Number },
      { _id: 0, a_Idx: 1 },
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
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 비밀번호 찾기 2차 검증 */
const pwSchema = Joi.object({
  a_Pw: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
      ),
    )
    .required(),
  a_Idx: Joi.number().required(),
});

/** 비밀번호 찾기 2차 */
router.put('/reset-password', async (req, res) => {
  try {
    const { a_Idx, a_Pw } = await pwSchema.validateAsync(req.body);

    /** 존재하는 유저인가 확인 */
    const adminNo = await Admin.find({ a_Idx }).exec();
    if (adminNo.length === 0) {
      return res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
    }

    /** 비밀번호 hash 처리 */
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(a_Pw, salt);

    await Admin.updateOne({ a_Idx }, { $set: { a_Pw: hashPw } });

    return res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 로그인 검증 */
const loginSchema = Joi.object({
  a_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  a_Pw: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
      ),
    )
    .required(),
});

/** 로그인 */
router.post('/login', async (req, res) => {
  try {
    const { a_Id, a_Pw } = await loginSchema.validateAsync(req.body);

    const admin = await Admin.findOne({ a_Id }).exec();

    if (!admin) {
      return res.status(400).send({
        errorMessage: '아이디 또는 비밀번호를 확인해주세요',
      });
    }

    let a_Brand = admin.a_Brand;

    /** 비밀번호 매치 검사 */
    const authenticate = await bcrypt.compare(a_Pw, admin.a_Pw);

    if (authenticate === true) {
      /** 비밀번호 일치하면 토큰 생성 */
      const token = jwt.sign({ a_Idx: admin.a_Idx }, jwtKey);

      return res.status(200).send({
        a_Brand,
        token,
      });
    } else {
      return res.status(401).send({
        errorMessage: '아이디 또는 비밀번호를 확인해주세요',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      errorMessage: '입력한 내용을 다시 확인해주세요',
    });
  }
});

/** 판매자 회원 탈퇴 */
router.delete('/', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    const prodData = await Product.find({ a_Idx }, { _id: 0, p_No: 1 });

    /** 배송 관리에 신규주문 상품 있으면 false */
    const orderData = await AdminOrder.find({
      a_Idx,
      o_Status: '신규주문',
    }).exec();
    if (orderData.length != null) {
      return res.status(400).send({
        errorMessage: '신규주문이 존재합니다.',
      });
    } else {
      for (let i in prodData) {
        /** 위시리스트 삭제 */
        await Wish.deleteOne({ p_No: prodData[i].p_No });
      }
      /** 상품 삭제 */
      await Product.deleteMany({ a_Idx });
      /** 키워드 삭제 */
      await Keyword.deleteMany({ a_Idx });
    }
    /** 회원 삭제 */
    await Admin.deleteOne({ a_Idx });

    return res.status(200).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      errorMessage: '삭제 중 오류 발생',
    });
  }
});

module.exports = router;

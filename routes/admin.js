const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../schemas/admins');
const bcrypt = require('bcrypt');
const auth = require('../middlewares/admin-middleware');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.A_TOKEN;

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
  a_Phone: Joi.string()
    .pattern(new RegExp('^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$'))
    .required(),
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
      res.status(400).send({
        errorMessage: '중복된 아이디입니다.',
      });
      return;
    }

    /** 연락처 중복 확인 */
    const adminPhone = await Admin.find({ a_Phone: a_Phone }).exec();
    if (adminPhone.length !== 0) {
      res.status(400).send({
        errorMessage: '중복된 연락처입니다.',
      });
      return;
    }

    /** 사업자번호 중복 확인 */
    const adminNumber = await Admin.find({ a_Number: a_Number }).exec();
    if (adminNumber.length !== 0) {
      res.status(400).send({
        errorMessage: '중복된 사업자번호입니다.',
      });
      return;
    }

    /** 비밀번호 hash 처리 */
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(a_Pw, salt);

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..*/, '');

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

    res.status(201).send({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

module.exports = router;

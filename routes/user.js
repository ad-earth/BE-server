const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../schemas/users');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middlewares/auth-middleware');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.JWT_TOKEN;

/** 회원가입 검증 */
const registerSchema = Joi.object({
  u_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  u_Pw: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
      ),
    )
    .required(),
  u_Phone: Joi.string()
    .pattern(new RegExp('^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$'))
    .required(),
  u_Name: Joi.string().required(),
  u_Gender: Joi.boolean().required(),
  u_Address1: Joi.string().required(),
  u_Address2: Joi.string().required(),
  u_Img: Joi.string().required(),
});

/** 회원가입 */
router.post('/register', async (req, res) => {
  try {
    const {
      u_Id,
      u_Pw,
      u_Phone,
      u_Name,
      u_Gender,
      u_Address1,
      u_Address2,
      u_Img,
    } = await registerSchema.validateAsync(req.body);
    /** 유저 번호 확인 및 생성 */
    const recentUser = await User.find().sort('-u_Idx').limit(1);
    let u_Idx = 1;
    if (recentUser.length != 0) {
      u_Idx = recentUser[0]['u_Idx'] + 1;
    }
    /** 아이디 중복 확인 */
    const userId = await User.find({ u_Id: u_Id });
    if (userId.length !== 0) {
      res.status(400).send({
        errorMessage: '중복된 아이디입니다.',
      });
      return;
    }
    /** 연락처 중복 확인 */
    const userPhone = await User.find({ u_Phone: u_Phone });
    if (userPhone.length !== 0) {
      res.status(400).send({
        errorMessage: '중복된 연락처입니다.',
      });
      return;
    }

    /** 비밀번호 hash 처리 */
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(u_Pw, salt);

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..*/, '');

    /** DB 생성 */
    await User.create({
      u_Idx,
      u_Id,
      u_Pw: hashPw,
      u_Name,
      u_Address1,
      u_Address2,
      u_Gender,
      u_Phone,
      u_Img,
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

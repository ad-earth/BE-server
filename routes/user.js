const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../schemas/users');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/user-middleware');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.U_TOKEN;

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
  u_Gender: Joi.string().required(),
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
    const userId = await User.find({ u_Id: u_Id }).exec();
    if (userId.length !== 0) {
      res.status(400).send({
        errorMessage: '중복된 아이디입니다.',
      });
      return;
    }
    /** 연락처 중복 확인 */
    const userPhone = await User.find({ u_Phone: u_Phone }).exec();
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
    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

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
    console.log(error);
    res.status(400).send({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 아이디 검증 */
const findIdSchema = Joi.object({
  u_Name: Joi.string().required(),
  u_Phone: Joi.string()
    .pattern(new RegExp('^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$'))
    .required(),
});
/** 아이디 찾기 */
router.get('/find-id', async (req, res) => {
  try {
    const { u_Name, u_Phone } = await findIdSchema.validateAsync(req.body);
    const userName = await User.find({ u_Name: u_Name }).exec();
    const userPhone = await User.find({ u_Phone: u_Phone }).exec();
    if (userName.length === 0 || userPhone.length === 0) {
      res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
      return;
    }
    let data = await User.findOne(
      { u_Name, u_Phone },
      { _id: 0, u_Id: 1 },
    ).exec();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 비밀번호 찾기 1차 검증 */
const findPwSchema = Joi.object({
  u_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  u_Phone: Joi.string()
    .pattern(new RegExp('^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$'))
    .required(),
  u_Name: Joi.string().required(),
});

/** 비밀번호 찾기 1차 */
router.get('/find-password', async (req, res) => {
  try {
    const { u_Id, u_Name, u_Phone } = await findPwSchema.validateAsync(
      req.body,
    );
    const userId = await User.find({ u_Id: u_Id }).exec();
    const userName = await User.find({ u_Name: u_Name }).exec();
    const userPhone = await User.find({ u_Phone: u_Phone }).exec();
    if (userId.length == 0 || userName.length == 0 || userPhone.length == 0) {
      res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
      return;
    }
    let data = await User.findOne(
      { u_Name, u_Phone, u_Id },
      { _id: 0, u_Idx: 1 },
    ).exec();
    if (data == null) {
      res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
      return;
    }
    res.status(200).send(data);
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

/** 비밀번호 찾기 2차 검증 */
const pwSchema = Joi.object({
  u_Pw: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$',
      ),
    )
    .required(),
  u_Idx: Joi.number().required(),
});

/** 비밀번호 찾기 2차 */
router.put('/reset-password', async (req, res) => {
  try {
    const { u_Idx, u_Pw } = await pwSchema.validateAsync(req.body);
    /** 존재하는 유저인가 확인 */
    const userNo = await User.find({ u_Idx }).exec();
    if (userNo.length === 0) {
      res.status(400).send({
        errorMessage: '존재하지 않는 회원입니다.',
      });
      return;
    }
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(u_Pw, salt);
    await User.updateOne({ u_Idx }, { $set: { u_Pw: hashPw } });
    res.status(201).send({
      success: true,
    });
    return;
  } catch (error) {
    res.status(400).send({
      success: false,
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
    return;
  }
});

/** 로그인 검증 */
const loginSchema = Joi.object({
  u_Id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,10}$')).required(),
  u_Pw: Joi.string()
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
    const { u_Id, u_Pw } = await loginSchema.validateAsync(req.body);
    const user = await User.findOne({ u_Id }).exec();
    if (!user) {
      res.status(400).send({
        errorMessage: '아이디 또는 비밀번호를 확인해주세요',
      });
      return;
    }
    let u_Idx = user.u_Idx;
    let u_Name = user.u_Name;
    let u_Address1 = user.u_Address1;
    let u_Address2 = user.u_Address2;
    let u_Gender = user.u_Gender;
    let u_Phone = user.u_Phone;
    let u_Img = user.u_Img;

    /** 비밀번호 매치 검사 */
    const authenticate = await bcrypt.compare(u_Pw, user.u_Pw);

    if (authenticate === true) {
      const token = jwt.sign({ u_Idx: user.u_Idx }, jwtKey);

      res.status(200).send({
        u_Idx,
        u_Id,
        u_Name,
        u_Address1,
        u_Address2,
        u_Gender,
        u_Phone,
        u_Img,
        token,
      });
      return;
    } else {
      res.status(401).send({
        errorMessage: '아이디 또는 비밀번호를 확인해주세요',
      });
      return;
    }
  } catch (error) {
    res.status(400).send({
      errorMessage: '입력한 내용을 다시 확인해주세요',
    });
    return;
  }
});

/** 정보 수정 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { u_Name, u_Address1, u_Address2, u_Gender, u_Phone, u_Img } =
      req.body;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    await User.updateOne(
      { u_Idx },
      {
        $set: {
          u_Name,
          u_Address1,
          u_Address2,
          u_Gender,
          u_Phone,
          u_Img,
        },
      },
    );
    res.status(201).send({
      success: true,
    });
    return;
  } catch (error) {
    res.status(400).send({
      errorMessage: '수정 중 오류 발생',
    });
  }
});

/** 정보 삭제 */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    await User.deleteOne({ u_Idx });
    res.status(200).send({
      success: true,
    });
    return;
  } catch (error) {
    res.status(400).send({
      errorMessage: '삭제 중 오류 발생',
    });
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const Admin = require('../schemas/admins');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.A_TOKEN;

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  const [tokenType, tokenValue] = (authorization || '').split(' ');
  if (tokenType !== 'Bearer') {
    res.status(401).send({
      errorMessage: '로그인 후 사용 가능합니다.',
    });
    return;
  }
  try {
    const { a_Idx } = jwt.verify(tokenValue, jwtKey);

    Admin.findOne({ a_Idx })
      .exec()
      .then(admin => {
        res.locals.admin = admin;
        next();
      });
  } catch (error) {
    res.status(401).send({
      errorMessage: '로그인 후 사용 가능합니다.',
    });
    return;
  }
};

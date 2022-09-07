const jwt = require('jsonwebtoken');
const User = require('../schemas/users');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.JWT_TOKEN;

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
    const { u_Idx } = jwt.verify(tokenValue, jwtKey);

    User.findOne({ u_Idx })
      .exec()
      .then(user => {
        res.locals.user = user;
        next();
      });
  } catch (error) {
    res.status(401).send({
      errorMessage: '로그인 후 사용 가능합니다.',
    });
    return;
  }
};

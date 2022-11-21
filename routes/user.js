const express = require('express');
const router = express.Router();
const clientController = require('../controllers/user');
const middleware = require('../middlewares/client-middleware');

router
  .post('/register', clientController.createClient) // 회원가입
  .post('/login', clientController.createClientToken) // 로그인
  .get('/find-id', clientController.getClientId) // 아이디 찾기
  .get('/find-password', clientController.getClientPw) // 비밀번호 찾기
  .put('/reset-password', clientController.updateClientPw) // 비밀번호 재설정
  .put('/', middleware, clientController.updateClientInfo) // 회원 정보 수정
  .delete('/', middleware, clientController.deleteClient); // 회원 탈퇴

module.exports = router;

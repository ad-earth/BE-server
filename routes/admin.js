const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const middleware = require('../middlewares/admin-middleware');

router
  .post('/register', adminController.createAdmin) // 회원가입
  .post('/login', adminController.createAdminToken) // 로그인
  .get('/find-id', adminController.getAdminId) // 아이디 찾기
  .get('/find-password', adminController.getAdminPw) // 비밀번호 찾기
  .put('/reset-password', adminController.updateAdminPw) // 비밀번호 재설정
  .delete('/', middleware, adminController.deleteAdmin); // 회원 탈퇴

module.exports = router;

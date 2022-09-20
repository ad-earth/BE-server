const express = require('express');
const router = express.Router();
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/admin-middleware');

/** 광고 관리 - 상품 선택 */
router.get('/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    let keywords = await Keyword.find(
      { p_No },
      {
        _id: 0,
        k_No: 1,
        keyword: 1,
        k_Level: 1,
        k_Cost: 1,
        k_Click: 1,
        k_Status: 1,
      },
    ).exec();

    res.status(200).json({
      keywords,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 광고 관리 - 키워드 선택 삭제(복수 가능) */
router.delete('/:p_No', auth, async (req, res) => {
  try {
    const { keywords } = req.body;
    const { p_No } = req.params;

    if (keywords.length != 0) {
      for (let i = 0; i < keywords.length; i++) {
        await Keyword.deleteOne({ k_No: keywords[i], p_No });
      }
    } else {
      res.status(404).json({
        errorMessage: '삭제할 키워드를 선택해주세요',
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'delete success',
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
